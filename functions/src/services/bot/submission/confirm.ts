import {
  getUser,
  getActiveSessionId,
  updateUserState,
  createSubmission,
  createOrUpdateEntry,
} from "../../firestoreService";
import { replyText, replyFlexMessage } from "../../messageService";
import { InstrumentalParts, InstrumentalPart } from "../../../types/InstrumentalPart";
import { createConfirmFlexMessage, createSelectionFlexMessage, createPartsFlexMessage } from "../../../utils/flexButton";

export async function onConfirm(userId: string, replyToken: string, text: string) {

  if (text === "修正する") {
    await updateUserState(userId, { state: "EDIT_CHOICE" });
    const message = createSelectionFlexMessage("どの項目を修正する？", [
      { label: "曲名", text: "曲名を修正" },
      { label: "アーティスト", text: "アーティストを修正" },
      { label: "音源URL", text: "音源URLを修正" },
      { label: "コード譜URL", text: "コード譜URLを修正" },
      { label: "参考動画URL", text: "参考動画URLを修正" },
      { label: "必要楽器", text: "必要楽器を修正" },
      { label: "担当楽器", text: "担当楽器を修正" },
      { label: "その他", text: "その他を修正" },
      { label: "キャンセル", text: "修正キャンセル" },
    ]);
    return replyFlexMessage(replyToken, message);
  }

  if (text !== "提出する") {
    return replyText(replyToken, "「提出する」「修正する」のいずれかを選んでね。");
  }

  const user = await getUser(userId);
  if (!user) return replyText(replyToken, "エラーが発生しました。");

  const { submissionDraft: draft } = user;
  const title = draft?.title ?? "";
  const artist = draft?.artist ?? "";
  const audioUrl = draft?.audioUrl ?? "";
  const scoreUrl = draft?.scoreUrl ?? "";
  const referenceUrl1 = draft?.referenceUrl1 ?? "";
  const referenceUrl2 = draft?.referenceUrl2 ?? "";
  const referenceUrl3 = draft?.referenceUrl3 ?? "";
  const referenceUrl4 = draft?.referenceUrl4 ?? "";
  const referenceUrl5 = draft?.referenceUrl5 ?? "";
  const description = draft?.description ?? "";
  const parts = draft?.parts ?? [];
  const myParts = draft?.myParts ?? [];

  const sessionId = await getActiveSessionId();

  await createSubmission({
    sessionId,
    userId,
    title,
    artist,
    audioUrl,
    scoreUrl,
    referenceUrl1,
    referenceUrl2,
    referenceUrl3,
    referenceUrl4,
    referenceUrl5,
    description,
    parts,
    myParts,
  });

  await createOrUpdateEntry({
    sessionId,
    submissionUserId: userId,
    userId: userId,
    parts: myParts,
  });

  await updateUserState(userId, { state: "IDLE", submissionDraft: {} });

  return replyText(replyToken, `提出したよ！\n${title} / ${artist}`);
}

export async function onEditChoice(userId: string, replyToken: string, text: string) {
  switch (text) {
    case "曲名を修正":
      await updateUserState(userId, { state: "EDIT_TITLE" });
      return replyText(replyToken, "新しい曲名は？");
    case "アーティストを修正":
      await updateUserState(userId, { state: "EDIT_ARTIST" });
      return replyText(replyToken, "新しいアーティストは？");
    case "音源URLを修正":
      await updateUserState(userId, { state: "EDIT_AUDIO_URL" });
      return replyText(replyToken, "新しい音源URLは？（なければ「なし」）");
    case "コード譜URLを修正":
      await updateUserState(userId, { state: "EDIT_SCORE_URL" });
      return replyText(replyToken, "新しいコード譜URLは？（なければ「なし」）");
    case "参考動画URLを修正":
      await updateUserState(userId, { state: "EDIT_REFERENCE_URL_1" });
      return replyText(replyToken, "新しい参考動画①のURLは？（なければ「なし」）");
    case "必要楽器を修正":
      {
        const user = await getUser(userId);
        const currentParts = user.submissionDraft?.parts || [];
        await updateUserState(userId, { state: "EDIT_PARTS" });
        const message = createPartsFlexMessage("必要な楽器を選んでね（複数可）", currentParts);
        return replyFlexMessage(replyToken, message);
      }
    case "担当楽器を修正":
      {
        const user = await getUser(userId);
        const requiredParts = user.submissionDraft?.parts || [];
        const currentMyParts = user.submissionDraft?.myParts || [];
        await updateUserState(userId, { state: "EDIT_MY_PARTS" });
        const message = createPartsFlexMessage("自分が担当する楽器を選んでね（複数可）", currentMyParts, requiredParts);
        return replyFlexMessage(replyToken, message);
      }
    case "その他を修正":
      await updateUserState(userId, { state: "EDIT_DESCRIPTION" });
      return replyText(replyToken, "その他伝達事項を教えてね（なければ「なし」）");
    case "修正キャンセル":
      return showConfirm(userId, replyToken);
    default:
      return replyText(replyToken, "修正したい項目をボタンから選んでね。");
  }
}

async function showConfirm(userId: string, replyToken: string) {
  await updateUserState(userId, { state: "CONFIRM" });
  const user = await getUser(userId);
  const draft = user.submissionDraft;
  if (!draft) return replyText(replyToken, "エラーが発生しました。");

  const summary = [
    `曲名: ${draft.title}`,
    `アーティスト: ${draft.artist}`,
    `音源URL: ${draft.audioUrl || "なし"}`,
    `コード譜URL: ${draft.scoreUrl || "なし"}`,
    `参考1: ${draft.referenceUrl1 || "なし"}`,
    `参考2: ${draft.referenceUrl2 || "なし"}`,
    `参考3: ${draft.referenceUrl3 || "なし"}`,
    `参考4: ${draft.referenceUrl4 || "なし"}`,
    `参考5: ${draft.referenceUrl5 || "なし"}`,
    `必要楽器: ${(draft.parts || []).join(", ")}`,
    `担当楽器: ${(draft.myParts || []).join(", ")}`,
    `その他: ${draft.description || "なし"}`,
  ].join("\n");

  const message = createConfirmFlexMessage("これで提出する？", summary);
  return replyFlexMessage(replyToken, message);
}

export async function onEditTitle(userId: string, replyToken: string, text: string) {
  await updateUserState(userId, { submissionDraft: { title: text } });
  return showConfirm(userId, replyToken);
}

export async function onEditArtist(userId: string, replyToken: string, text: string) {
  await updateUserState(userId, { submissionDraft: { artist: text } });
  return showConfirm(userId, replyToken);
}

export async function onEditAudioUrl(userId: string, replyToken: string, text: string) {
  const audioUrl = (text === "なし") ? "" : text;
  await updateUserState(userId, { submissionDraft: { audioUrl } });
  return showConfirm(userId, replyToken);
}

export async function onEditScoreUrl(userId: string, replyToken: string, text: string) {
  const scoreUrl = (text === "なし") ? "" : text;
  await updateUserState(userId, { submissionDraft: { scoreUrl } });
  return showConfirm(userId, replyToken);
}

export async function onEditReferenceUrl1(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      submissionDraft: {
        referenceUrl1: "",
        referenceUrl2: "",
        referenceUrl3: "",
        referenceUrl4: "",
        referenceUrl5: "",
      }
    });
    return showConfirm(userId, replyToken);
  }
  await updateUserState(userId, {
    state: "EDIT_REFERENCE_URL_2",
    submissionDraft: { referenceUrl1: text }
  });
  return replyText(replyToken, "新しい参考動画②のURLは？（なければ「なし」）");
}

export async function onEditReferenceUrl2(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      submissionDraft: {
        referenceUrl2: "",
        referenceUrl3: "",
        referenceUrl4: "",
        referenceUrl5: "",
      }
    });
    return showConfirm(userId, replyToken);
  }
  await updateUserState(userId, {
    state: "EDIT_REFERENCE_URL_3",
    submissionDraft: { referenceUrl2: text }
  });
  return replyText(replyToken, "新しい参考動画③のURLは？（なければ「なし」）");
}

export async function onEditReferenceUrl3(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      submissionDraft: {
        referenceUrl3: "",
        referenceUrl4: "",
        referenceUrl5: "",
      }
    });
    return showConfirm(userId, replyToken);
  }
  await updateUserState(userId, {
    state: "EDIT_REFERENCE_URL_4",
    submissionDraft: { referenceUrl3: text }
  });
  return replyText(replyToken, "新しい参考動画④のURLは？（なければ「なし」）");
}

export async function onEditReferenceUrl4(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      submissionDraft: {
        referenceUrl4: "",
        referenceUrl5: "",
      }
    });
    return showConfirm(userId, replyToken);
  }
  await updateUserState(userId, {
    state: "EDIT_REFERENCE_URL_5",
    submissionDraft: { referenceUrl4: text }
  });
  return replyText(replyToken, "新しい参考動画⑤のURLは？（なければ「なし」）");
}

export async function onEditReferenceUrl5(userId: string, replyToken: string, text: string) {
  const referenceUrl5 = (text === "なし") ? "" : text;
  await updateUserState(userId, { submissionDraft: { referenceUrl5 } });
  return showConfirm(userId, replyToken);
}

export async function onEditParts(userId: string, replyToken: string, text: string) {
  const user = await getUser(userId);
  const currentParts = user.submissionDraft?.parts || [];

  if (text === "選択終了") {
    if (currentParts.length === 0) {
      const message = createPartsFlexMessage("必要な楽器を選んでね（複数可）", currentParts, undefined, "選択終了");
      return replyFlexMessage(replyToken, message, "最低一つは楽器を選んでね。");
    }
    // 必要楽器から外れた担当楽器を自動削除
    const currentMyParts = user.submissionDraft?.myParts || [];
    const newMyParts = currentMyParts.filter(p => currentParts.includes(p));
    await updateUserState(userId, { submissionDraft: { myParts: newMyParts } });

    return showConfirm(userId, replyToken);
  }

  const part = text as InstrumentalPart;
  if (!InstrumentalParts.includes(part)) {
    const message = createPartsFlexMessage("必要な楽器を選んでね（複数可）", currentParts);
    return replyFlexMessage(replyToken, message, "ボタンから選んでね。");
  }

  const newParts = currentParts.includes(part)
    ? currentParts.filter(p => p !== part)
    : [...currentParts, part];

  await updateUserState(userId, { submissionDraft: { parts: newParts } });
  const message = createPartsFlexMessage("必要な楽器を選んでね（複数可）", newParts);
  return replyFlexMessage(replyToken, message);
}

export async function onEditMyParts(userId: string, replyToken: string, text: string) {
  const user = await getUser(userId);
  const currentMyParts = user.submissionDraft?.myParts || [];
  const requiredParts = user.submissionDraft?.parts || [];

  if (text === "選択終了") {
    if (currentMyParts.length === 0) {
      const message = createPartsFlexMessage("自分が担当する楽器を選んでね（複数可）", currentMyParts, requiredParts);
      return replyFlexMessage(replyToken, message, "最低一つは自分の担当楽器を選んでね。");
    }
    return showConfirm(userId, replyToken);
  }

  const part = text as InstrumentalPart;
  if (!InstrumentalParts.includes(part)) {
    const message = createPartsFlexMessage("自分が担当する楽器を選んでね（複数可）", currentMyParts, requiredParts);
    return replyFlexMessage(replyToken, message, "ボタンから選んでね。");
  }

  const newMyParts = currentMyParts.includes(part)
    ? currentMyParts.filter(p => p !== part)
    : [...currentMyParts, part];

  await updateUserState(userId, { submissionDraft: { myParts: newMyParts } });
  const message = createPartsFlexMessage("自分が担当する楽器を選んでね（複数可）", newMyParts, requiredParts);
  return replyFlexMessage(replyToken, message);
}

export async function onEditDescription(userId: string, replyToken: string, text: string) {
  const description = (text === "なし") ? "" : text;
  await updateUserState(userId, { submissionDraft: { description } });
  return showConfirm(userId, replyToken);
}
