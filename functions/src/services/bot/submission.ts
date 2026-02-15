import {
  findOrCreateUser,
  getActiveSessionId,
  updateUserState,
  getSubmission,
  createSubmission,
  deleteSubmission,
} from "../firestoreService";

import { replyText } from "../messageService";

export async function handleSubmission(userId: string, replyToken: string, text: string) {

  // いつでも効くコマンド
  if (text === "キャンセル") return resetState(userId, replyToken, "キャンセルしたよ。");
  if (text === "ヘルプ") return replyHelp(replyToken);
  if (text === "状況") return replyStatus(userId, replyToken);
  if (text === "削除") return deleteSubmissionCommand(userId, replyToken);

  const user = await findOrCreateUser(userId);

  switch (user.state) {
    case "IDLE":
      if (text === "提出") return startSubmission(userId, replyToken);
      return replyHelp(replyToken);
    case "ASK_TITLE":
      return onTitle(userId, replyToken, text);
    case "ASK_ARTIST":
      return onArtist(userId, replyToken, text);
    case "ASK_URL":
      return onUrl(userId, replyToken, text);
    case "CONFIRM":
      return onConfirm(userId, replyToken, text);
    default:
      return resetState(userId, replyToken, "状態が不明だったので最初からやり直そう。『提出』と送ってね。");
  }
}

async function startSubmission(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const sub = await getSubmission(sessionId, userId);

  if (sub) {
    return replyText(replyToken, `今月はすでに提出済みだよ：\n${sub.titleRaw} / ${sub.artistRaw}\n変更したいなら「変更」と送ってね。`);
  }

  await updateUserState(userId, {
    state: "ASK_TITLE",
    draft: {},
  });

  return replyText(replyToken, "曲名は？");
}

async function onTitle(userId: string, replyToken: string, title: string) {
  await updateUserState(userId, {
    state: "ASK_ARTIST",
    draft: {
      title,
    },
  });
  return replyText(replyToken, "アーティストは？");
}

async function onArtist(userId: string, replyToken: string, artist: string) {
  await updateUserState(userId, {
    state: "ASK_URL",
    draft: {
      artist,
    },
  });
  return replyText(replyToken, "参考URLあれば送ってね（なければ「なし」）");
}

async function onUrl(userId: string, replyToken: string, urlText: string) {
  const url = (urlText === "なし") ? "" : urlText;

  await updateUserState(userId, {
    state: "CONFIRM",
    draft: {
      url,
    },
  });

  return replyText(replyToken, `これで登録する？\n（はい / いいえ）\nURL: ${url || "なし"}`);
}

async function onConfirm(userId: string, replyToken: string, text: string) {
  if (text === "いいえ") {
    await updateUserState(userId, { state: "ASK_TITLE", draft: {} });
    return replyText(replyToken, "OK！最初からやり直そう。曲名は？");
  }
  if (text !== "はい") {
    return replyText(replyToken, "「はい」か「いいえ」で答えてね。");
  }

  const user = await findOrCreateUser(userId);
  if (!user) return replyText(replyToken, "エラーが発生しました。");

  const { draft } = user;
  const titleRaw = draft?.title ?? "";
  const artistRaw = draft?.artist ?? "";
  const url = draft?.url ?? "";

  const sessionId = await getActiveSessionId();

  await createSubmission({
    sessionId,
    userId,
    titleRaw,
    artistRaw,
    url,
  });

  // stateリセット
  await updateUserState(userId, { state: "IDLE", draft: {} });

  return replyText(replyToken, `登録したよ！\n${titleRaw} / ${artistRaw}`);
}

async function resetState(userId: string, replyToken: string, message: string) {
  await updateUserState(userId, {
    state: "IDLE",
    draft: {},
  });
  return replyText(replyToken, message);
}

async function replyHelp(replyToken: string) {
  const lines = [
    "「提出」と送ると課題曲を登録できるよ。",
    "「状況」で現在の提出を確認できるよ。",
    "「削除」で提出を消去できるよ。",
    "「キャンセル」で入力を中断できるよ。",
  ]
  return replyText(replyToken, lines.join("\n"));
}

async function replyStatus(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const sub = await getSubmission(sessionId, userId);

  if (!sub) {
    return replyText(replyToken, "今月はまだ提出していないよ。");
  }

  return replyText(replyToken, `現在の提出状況：\n${sub.titleRaw} / ${sub.artistRaw}\nURL: ${sub.url || "なし"}`);
}

async function deleteSubmissionCommand(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const sub = await getSubmission(sessionId, userId);

  if (!sub) {
    return replyText(replyToken, "削除する提出がないよ。");
  }

  await deleteSubmission(sessionId, userId);
  return replyText(replyToken, "提出を削除したよ。");
}
