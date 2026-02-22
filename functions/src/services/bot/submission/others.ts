import {
  getActiveSessionId,
  updateUserState,
  getSubmission,
  deleteSubmission,
  deleteEntriesBySubmission,
} from "../../firestoreService";
import { replyText } from "../../messageService";
import { SUBMISSIONS_WEB_URL } from "../../../index";

export async function resetState(userId: string, replyToken: string, message: string) {
  await updateUserState(userId, {
    state: "IDLE",
    submissionDraft: {},
  });
  return replyText(replyToken, message);
}

export async function replyHelp(replyToken: string) {
  const lines = [
    "「提出」と送ると課題曲を登録できるよ。",
    "「状況」で現在の提出を確認できるよ。",
    "「一覧」で曲の詳細を確認できるウェブサイトを案内するよ。",
    "「削除」で提出を消去できるよ。",
    "「キャンセル」で入力を中止できるよ。",
  ]
  return replyText(replyToken, lines.join("\n"));
}

export async function replyStatus(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const sub = await getSubmission(sessionId, userId);

  if (!sub) {
    return replyText(replyToken, "今月はまだ提出していないよ。");
  }

  const statusText = [
    `現在の提出状況：`,
    `${sub.title} / ${sub.artist}`,
    `音源URL: ${sub.audioUrl || "なし"}`,
    `コード譜URL: ${sub.scoreUrl || "なし"}`,
    `参考URL1: ${sub.referenceUrl1 || "なし"}`,
    `必要楽器: ${sub.parts.join(", ")}`,
    `担当楽器: ${sub.myParts.join(", ")}`,
    `その他: ${sub.description || "なし"}`,
  ].join("\n");

  return replyText(replyToken, statusText);
}

export async function replyList(replyToken: string) {
  const url = SUBMISSIONS_WEB_URL.value();
  if (!url) {
    return replyText(replyToken, "ごめん、一覧のURLが設定されていないみたい。");
  }

  const message = [
    "曲の詳細一覧は、以下のウェブサイトから確認してね！",
    "",
    url,
  ].join("\n");

  return replyText(replyToken, message);
}

export async function deleteSubmissionCommand(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const sub = await getSubmission(sessionId, userId);

  if (!sub) {
    return replyText(replyToken, "削除する提出がないよ。");
  }

  await deleteSubmission(sessionId, userId);
  await deleteEntriesBySubmission(sessionId, userId);

  return replyText(replyToken, "提出を削除したよ。");
}
