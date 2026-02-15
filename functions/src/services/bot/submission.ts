import {
  findOrCreateUser,
  getActiveSessionId,
  updateUserState,
  getSubmission,
  getSubmissions,
  createSubmission,
  deleteSubmission,
} from "../firestoreService";

import { replyText, replyFlexMessage } from "../messageService";
import { InstrumentalParts, InstrumentalPart, DefaultInstrumentalParts } from "../../types/InstrumentalPart";
import { createPartsFlexMessage } from "../../utils/flexButton";

export async function handleSubmission(userId: string, replyToken: string, text: string) {

  // いつでも効くコマンド
  if (text === "キャンセル") return resetState(userId, replyToken, "キャンセルしたよ。");
  if (text === "ヘルプ") return replyHelp(replyToken);
  if (text === "状況") return replyStatus(userId, replyToken);
  if (text === "一覧") return replyList(replyToken);
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
    case "ASK_PARTS":
      return onParts(userId, replyToken, text);
    case "ASK_MY_PARTS":
      return onMyParts(userId, replyToken, text);
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
    state: "ASK_PARTS",
    draft: {
      url,
      parts: [...DefaultInstrumentalParts],
    },
  });

  return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", [...DefaultInstrumentalParts]);
}

async function onParts(userId: string, replyToken: string, text: string) {
  const user = await findOrCreateUser(userId);
  const currentParts = user.draft.parts || [];

  if (text === "選択終了") {
    if (currentParts.length === 0) {
      return replyText(replyToken, "最低一つは楽器を選んでね。");
    }
    await updateUserState(userId, {
      state: "ASK_MY_PARTS",
      draft: {
        myParts: [],
      },
    });
    return replyPartsFlex(replyToken, "自分が担当する楽器を選んでね（複数可）", [], currentParts);
  }

  const part = text as InstrumentalPart;
  if (!InstrumentalParts.includes(part)) {
    return replyText(replyToken, "ボタンから選んでね。");
  }

  const newParts = currentParts.includes(part)
    ? currentParts.filter(p => p !== part)
    : [...currentParts, part];

  await updateUserState(userId, {
    draft: {
      parts: newParts,
    },
  });

  return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", newParts);
}

async function onMyParts(userId: string, replyToken: string, text: string) {
  const user = await findOrCreateUser(userId);
  const currentMyParts = user.draft.myParts || [];
  const requiredParts = user.draft.parts || [];

  if (text === "選択終了") {
    if (currentMyParts.length === 0) {
      return replyText(replyToken, "最低一つは自分の担当楽器を選んでね。");
    }
    await updateUserState(userId, {
      state: "CONFIRM",
    });

    const { draft } = user;
    const summary = [
      `曲名: ${draft.title}`,
      `アーティスト: ${draft.artist}`,
      `URL: ${draft.url || "なし"}`,
      `必要楽器: ${requiredParts.join(", ")}`,
      `担当楽器: ${currentMyParts.join(", ")}`,
    ].join("\n");

    return replyText(replyToken, `これで登録する？\n（はい / いいえ）\n\n${summary}`);
  }

  const part = text as InstrumentalPart;
  if (!InstrumentalParts.includes(part)) {
    return replyText(replyToken, "ボタンから選んでね。");
  }

  const newMyParts = currentMyParts.includes(part)
    ? currentMyParts.filter(p => p !== part)
    : [...currentMyParts, part];

  await updateUserState(userId, {
    draft: {
      myParts: newMyParts,
    },
  });

  return replyPartsFlex(replyToken, "自分が担当する楽器を選んでね（複数可）", newMyParts, requiredParts);
}

async function replyPartsFlex(replyToken: string, title: string, selected: InstrumentalPart[], filter?: InstrumentalPart[]) {
  const message = createPartsFlexMessage(title, selected, filter);
  return replyFlexMessage(replyToken, message);
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
  const parts = draft?.parts ?? [];
  const myParts = draft?.myParts ?? [];

  const sessionId = await getActiveSessionId();

  await createSubmission({
    sessionId,
    userId,
    titleRaw,
    artistRaw,
    url,
    parts,
    myParts,
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
    "「一覧」でみんなの提出を確認できるよ。",
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

  const statusText = [
    `現在の提出状況：`,
    `${sub.titleRaw} / ${sub.artistRaw}`,
    `URL: ${sub.url || "なし"}`,
    `必要楽器: ${sub.parts.join(", ")}`,
    `担当楽器: ${sub.myParts.join(", ")}`,
  ].join("\n");

  return replyText(replyToken, statusText);
}

async function replyList(replyToken: string) {
  const sessionId = await getActiveSessionId();
  const subs = await getSubmissions(sessionId);

  if (subs.length === 0) {
    return replyText(replyToken, "まだ誰も提出していないよ。");
  }

  const list = subs.map((s, i) => `${i + 1}. ${s.titleRaw} / ${s.artistRaw}`).join("\n");
  return replyText(replyToken, `現在の提出一覧：\n${list}`);
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
