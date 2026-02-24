import { WebhookEvent } from '@line/bot-sdk';
import * as logger from "firebase-functions/logger";

import { getCurrentSession, getUser, updateUserProfile, createUser } from "./firestoreService";
import { replyText, getProfile } from "./messageService";
import { handleSubmission } from "./bot/submission";
import { handleEntry } from "./bot/entry";
import { handleChat } from "./bot/chat";

export async function handleEvent(ev: WebhookEvent) {
  if (ev.type === "follow") {
    const userId = ev.source.userId;
    if (!userId) return;
    const profile = await getProfile(userId);
    try {
      await getUser(userId);
      await updateUserProfile(userId, {
        displayName: profile.displayName,
        photoURL: profile.pictureUrl || "",
      });
      return
    } catch (e) {
      await createUser(userId, profile.displayName, profile.pictureUrl);
    }
    return
  }

  if (ev.type !== "message" || ev.message.type !== "text") return;

  const userId = ev.source.userId;
  if (!userId) return;

  const text = (ev.message.text || "").trim();
  const replyToken = ev.replyToken;

  const user = await (async () => {
    const user = await getUser(userId);
    if (user) return user;
    const profile = await getProfile(userId);
    return createUser(userId, profile.displayName, profile.pictureUrl);
  })();

  // 会員状態のチェック
  if (user.memberState === "PENDING" || user.memberState === "BANNED") {
    await replyText(replyToken, "エラーが発生しました。管理者に連絡してください。");
    return;
  }

  // プロフィールが3日以上更新されていない場合は更新
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  if (user.profileUpdatedAt < threeDaysAgo) {
    try {
      const profile = await getProfile(userId);
      await updateUserProfile(userId, {
        displayName: profile.displayName,
        photoURL: profile.pictureUrl || "",
      });
    } catch (e) {
      console.error("Failed to update profile", e);
    }
  }

  const session = await getCurrentSession();

  if (!session) {
    await replyText(replyToken, "セッション情報がみつからないよ。管理者に連絡してね。");
    return
  }

  try {
    switch (session.state) {
      case "SUBMISSION":
        await handleSubmission(userId, replyToken, text);
        break;
      case "ENTRY":
        await handleEntry(userId, replyToken, text);
        break;
      default:
        await handleChat(userId, replyToken, text);
        break;
    }
  } catch (e) {
    logger.error("Failed to handle event", {error: e});
    // @ts-ignore
    await replyText(replyToken, `エラーが発生しました。管理者に連絡してね。 ${e.message}`);
    return
  }
}
