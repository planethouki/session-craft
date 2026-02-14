import { defineSecret } from "firebase-functions/params";
import * as admin from 'firebase-admin'
import { messagingApi, WebhookEvent } from '@line/bot-sdk';

import { UserState } from "./types/UserState";

const LINE_CHANNEL_ACCESS_TOKEN = defineSecret('LINE_CHANNEL_ACCESS_TOKEN')

export async function handleEvent(ev: WebhookEvent) {
  if (ev.type !== "message" || ev.message.type !== "text") return;

  const db = admin.firestore();
  const userId = ev.source.userId;
  if (!userId) return;

  const text = (ev.message.text || "").trim();
  const replyToken = ev.replyToken;

  // いつでも効くコマンド
  if (text === "キャンセル") return resetState(userId, replyToken, "キャンセルしたよ。");
  if (text === "ヘルプ") return replyHelp(replyToken);
  // if (text === "状況") return replyStatus(userId, replyToken);

  const userRef = db.doc(`users/${userId}`);
  const userSnap = await userRef.get();
  const user = userSnap.exists ? userSnap.data() as any : { state: "IDLE" };
  const userState: UserState = user.state;

  // 期間内かチェック（提出フローに入る直前が分かりやすい）
  if ((text === "提出" || userState !== "IDLE") && !(await isSubmissionOpen())) {
    return replyText(replyToken, "今月の提出期間外だよ。次回開始したら案内するね。");
  }

  switch (userState) {
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

async function isSubmissionOpen(): Promise<boolean> {
  const db = admin.firestore();
  const sessionSnap = await db.doc('sessions/current').get();
  if (!sessionSnap.exists) return false;
  const data = sessionSnap.data();
  if (!data) return false;

  const now = admin.firestore.Timestamp.now();
  const startAt = data.startAt as admin.firestore.Timestamp;
  const endAt = data.endAt as admin.firestore.Timestamp;

  return now.toMillis() >= startAt.toMillis() && now.toMillis() <= endAt.toMillis();
}

async function getActiveSessionId(): Promise<string> {
  const db = admin.firestore();
  const sessionSnap = await db.doc('sessions/current').get();
  if (!sessionSnap.exists) throw new Error("No active session");
  return sessionSnap.data()?.sessionId || "unknown";
}

async function startSubmission(userId: string, replyToken: string) {
  const db = admin.firestore();
  const sessionId = await getActiveSessionId();
  const subId = `${sessionId}_${userId}`;
  const subRef = db.doc(`submissions/${subId}`);
  const subSnap = await subRef.get();

  if (subSnap.exists) {
    const s = subSnap.data();
    return replyText(replyToken, `今月はすでに提出済みだよ：\n${s?.titleRaw} / ${s?.artistRaw}\n変更したいなら「変更」と送ってね。`);
  }

  await db.doc(`users/${userId}`).set({
    state: "ASK_TITLE",
    activeSessionId: sessionId,
    draft: {},
    stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return replyText(replyToken, "曲名は？");
}

async function onTitle(userId: string, replyToken: string, title: string) {
  const db = admin.firestore();
  await db.doc(`users/${userId}`).set({
    state: "ASK_ARTIST",
    draft: {
      title,
    },
    stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return replyText(replyToken, "アーティストは？");
}

async function onArtist(userId: string, replyToken: string, artist: string) {
  const db = admin.firestore();
  await db.doc(`users/${userId}`).set({
    state: "ASK_URL",
    draft: {
      artist,
    },
    stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return replyText(replyToken, "参考URLあれば送ってね（なければ「なし」）");
}

async function onUrl(userId: string, replyToken: string, urlText: string) {
  const db = admin.firestore();
  const url = (urlText === "なし") ? "" : urlText;

  await db.doc(`users/${userId}`).set({
    state: "CONFIRM",
    draft: {
      url,
    },
    stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return replyText(replyToken, `これで登録する？\n（はい / いいえ）\nURL: ${url || "なし"}`);
}

async function onConfirm(userId: string, replyToken: string, text: string) {
  const db = admin.firestore();
  if (text === "いいえ") {
    await db.doc(`users/${userId}`).set({ state: "ASK_TITLE", draft: {} }, { merge: true });
    return replyText(replyToken, "OK！最初からやり直そう。曲名は？");
  }
  if (text !== "はい") {
    return replyText(replyToken, "「はい」か「いいえ」で答えてね。");
  }

  const userRef = db.doc(`users/${userId}`);
  const userSnap = await userRef.get();
  const userData = userSnap.data();
  if (!userData) return replyText(replyToken, "エラーが発生しました。");

  const { activeSessionId, draft } = userData;
  const titleRaw = draft?.title ?? "";
  const artistRaw = draft?.artist ?? "";
  const url = draft?.url ?? "";

  const subId = `${activeSessionId}_${userId}`;
  const subRef = db.doc(`submissions/${subId}`);

  await db.runTransaction(async (tx) => {
    const subSnap = await tx.get(subRef);
    if (subSnap.exists) {
      return;
    }
    tx.set(subRef, {
      sessionId: activeSessionId,
      userId,
      titleRaw,
      artistRaw,
      url,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  // stateリセット
  await userRef.set({ state: "IDLE", draft: {}, stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  return replyText(replyToken, `登録したよ！\n${titleRaw} / ${artistRaw}`);
}

async function resetState(userId: string, replyToken: string, message: string) {
  const db = admin.firestore();
  await db.doc(`users/${userId}`).set({
    state: "IDLE",
    draft: {},
    stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return replyText(replyToken, message);
}

async function replyHelp(replyToken: string) {
  return replyText(replyToken, "「提出」と送ると課題曲を登録できるよ。\n「キャンセル」で入力を中断できるよ。");
}

async function replyText(replyToken: string, text: string) {
  const client = new messagingApi.MessagingApiClient({
    channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN.value(),
  });
  return client.replyMessage({
    replyToken,
    messages: [{ type: 'text', text }],
  });
}
