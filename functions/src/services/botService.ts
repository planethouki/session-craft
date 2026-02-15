import { WebhookEvent } from '@line/bot-sdk';

import { getCurrentSession, getUser, setUser } from "./firestoreService";
import { replyText, getProfile } from "./messageService";
import { handleSubmission } from "./bot/submission";
import { User } from '../types/User';

export async function handleEvent(ev: WebhookEvent) {
  if (ev.type !== "message" || ev.message.type !== "text") return;

  const userId = ev.source.userId;
  if (!userId) return;

  const text = (ev.message.text || "").trim();
  const replyToken = ev.replyToken;

  // ユーザー情報の取得または作成
  let user: User;
  try {
    user = await getUser(userId);
  } catch (e) {
    // ユーザーが存在しない場合は作成
    const profile = await getProfile(userId);
    user = {
      state: "IDLE",
      draft: {},
      stateUpdatedAt: new Date(),
      displayName: profile.displayName,
      photoURL: profile.pictureUrl || "",
      profileUpdatedAt: new Date(),
    };
    await setUser(userId, user);
  }

  // プロフィールが3日以上更新されていない場合は更新
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  if (user.profileUpdatedAt < threeDaysAgo) {
    try {
      const profile = await getProfile(userId);
      await setUser(userId, {
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

  switch (session.state) {
    case "SUBMISSION":
      await handleSubmission(userId, replyToken, text);
      break;
    default:
      return;
  }
}
