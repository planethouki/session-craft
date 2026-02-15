import { WebhookEvent } from '@line/bot-sdk';

import { getCurrentSession } from "./firestoreService";
import { replyText } from "./messageService";
import { handleSubmission } from "./bot/submission";

export async function handleEvent(ev: WebhookEvent) {
  if (ev.type !== "message" || ev.message.type !== "text") return;

  const userId = ev.source.userId;
  if (!userId) return;

  const text = (ev.message.text || "").trim();
  const replyToken = ev.replyToken;

  const session = await getCurrentSession();

  if (!session) {
    await replyText(replyToken, "セッション情報がみつからないよ。管理者に連絡してね。");
    return
  }

  switch (session.state) {
    case "SUBMISSION":
      await handleSubmission(userId, replyToken, text);
      break;
    default:
      return;
  }
}
