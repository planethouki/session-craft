import { WebhookEvent } from '@line/bot-sdk';

import {
  findOrCreateUser,
  getActiveSessionId,
  isSubmissionOpen,
  updateUserState,
  getSubmission,
  createSubmission
} from "./firestoreService";

import { messageService } from "./messageService";

export async function handleEvent(ev: WebhookEvent) {
  if (ev.type !== "message" || ev.message.type !== "text") return;

  const userId = ev.source.userId;
  if (!userId) return;

  const text = (ev.message.text || "").trim();
  const replyToken = ev.replyToken;

  // いつでも効くコマンド
  if (text === "キャンセル") return resetState(userId, replyToken, "キャンセルしたよ。");
  if (text === "ヘルプ") return replyHelp(replyToken);
  // if (text === "状況") return replyStatus(userId, replyToken);

  const user = await findOrCreateUser(userId);

  // 期間内かチェック（提出フローに入る直前が分かりやすい）
  if ((text === "提出" || user.state !== "IDLE") && !(await isSubmissionOpen())) {
    return replyText(replyToken, "今月の提出期間外だよ。次回開始したら案内するね。");
  }

  switch (user.state) {
    case "IDLE":
      if (text === "提出") return startSubmission(userId, replyToken);
      return replyText(replyToken, "「提出」と送ると課題曲を登録できるよ。");
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

  const { activeSessionId, draft } = user;
  const titleRaw = draft?.title ?? "";
  const artistRaw = draft?.artist ?? "";
  const url = draft?.url ?? "";

  await createSubmission({
    sessionId: activeSessionId,
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
  return replyText(replyToken, "「提出」と送ると課題曲を登録できるよ。\n「キャンセル」で入力を中断できるよ。");
}

async function replyText(replyToken: string, text: string) {
  return messageService.replyText(replyToken, text);
}
