import {
  getUser,
  getActiveSessionId,
  updateUserState,
  getSubmission,
} from "../firestoreService";

import { replyText, replyFlexMessage } from "../messageService";
import { InstrumentalParts, InstrumentalPart, DefaultInstrumentalParts } from "../../types/InstrumentalPart";
import { createPartsFlexMessage, createConfirmFlexMessage } from "../../utils/flexButton";
import {
  resetState,
  replyHelp,
  replyStatus,
  replyList,
  deleteSubmissionCommand
} from "./submission/others";
import {
  onConfirm,
  onEditChoice,
  onEditTitle,
  onEditArtist,
  onEditAudioUrl,
  onEditScoreUrl,
  onEditReferenceUrl1,
  onEditReferenceUrl2,
  onEditReferenceUrl3,
  onEditReferenceUrl4,
  onEditReferenceUrl5,
  onEditParts,
  onEditMyParts,
  onEditDescription,
} from "./submission/confirm";

export async function handleSubmission(userId: string, replyToken: string, text: string) {

  // いつでも効くコマンド
  if (text === "キャンセル") return resetState(userId, replyToken, "キャンセルしたよ。");
  if (text === "ヘルプ") return replyHelp(replyToken);
  if (text === "状況") return replyStatus(userId, replyToken);
  if (text === "一覧") return replyList(replyToken);
  if (text === "削除") return deleteSubmissionCommand(userId, replyToken);

  const user = await getUser(userId);

  switch (user.state) {
    case "IDLE":
      if (text === "提出") return startSubmission(userId, replyToken);
      return replyHelp(replyToken);
    case "ASK_TITLE":
      return onTitle(userId, replyToken, text);
    case "ASK_ARTIST":
      return onArtist(userId, replyToken, text);
    case "ASK_AUDIO_URL":
      return onAudioUrl(userId, replyToken, text);
    case "ASK_SCORE_URL":
      return onScoreUrl(userId, replyToken, text);
    case "ASK_REFERENCE_URL_1":
      return onReferenceUrl1(userId, replyToken, text);
    case "ASK_REFERENCE_URL_2":
      return onReferenceUrl2(userId, replyToken, text);
    case "ASK_REFERENCE_URL_3":
      return onReferenceUrl3(userId, replyToken, text);
    case "ASK_REFERENCE_URL_4":
      return onReferenceUrl4(userId, replyToken, text);
    case "ASK_REFERENCE_URL_5":
      return onReferenceUrl5(userId, replyToken, text);
    case "ASK_PARTS":
      return onParts(userId, replyToken, text);
    case "ASK_MY_PARTS":
      return onMyParts(userId, replyToken, text);
    case "ASK_DESCRIPTION":
      return onDescription(userId, replyToken, text);
    case "CONFIRM":
      return onConfirm(userId, replyToken, text);
    case "EDIT_CHOICE":
      return onEditChoice(userId, replyToken, text);
    case "EDIT_TITLE":
      return onEditTitle(userId, replyToken, text);
    case "EDIT_ARTIST":
      return onEditArtist(userId, replyToken, text);
    case "EDIT_AUDIO_URL":
      return onEditAudioUrl(userId, replyToken, text);
    case "EDIT_SCORE_URL":
      return onEditScoreUrl(userId, replyToken, text);
    case "EDIT_REFERENCE_URL_1":
      return onEditReferenceUrl1(userId, replyToken, text);
    case "EDIT_REFERENCE_URL_2":
      return onEditReferenceUrl2(userId, replyToken, text);
    case "EDIT_REFERENCE_URL_3":
      return onEditReferenceUrl3(userId, replyToken, text);
    case "EDIT_REFERENCE_URL_4":
      return onEditReferenceUrl4(userId, replyToken, text);
    case "EDIT_REFERENCE_URL_5":
      return onEditReferenceUrl5(userId, replyToken, text);
    case "EDIT_PARTS":
      return onEditParts(userId, replyToken, text);
    case "EDIT_MY_PARTS":
      return onEditMyParts(userId, replyToken, text);
    case "EDIT_DESCRIPTION":
      return onEditDescription(userId, replyToken, text);
    default:
      return resetState(userId, replyToken, "状態が不明だったので最初からやり直そう。『提出』と送ってね。");
  }
}

async function startSubmission(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const sub = await getSubmission(sessionId, userId);

  if (sub) {
    return replyText(replyToken, `すでに提出済みだよ：\n${sub.title} / ${sub.artist}`);
  }

  await updateUserState(userId, {
    state: "ASK_TITLE",
    submissionDraft: {},
  });

  return replyText(replyToken, "曲名は？");
}

async function onTitle(userId: string, replyToken: string, title: string) {
  await updateUserState(userId, {
    state: "ASK_ARTIST",
    submissionDraft: {
      title,
    },
  });
  return replyText(replyToken, "アーティストは？");
}

async function onArtist(userId: string, replyToken: string, artist: string) {
  await updateUserState(userId, {
    state: "ASK_AUDIO_URL",
    submissionDraft: {
      artist,
    },
  });
  return replyText(replyToken, "音源のURLは？（なければ「なし」）");
}

async function onAudioUrl(userId: string, replyToken: string, text: string) {
  const audioUrl = (text === "なし") ? "" : text;
  await updateUserState(userId, {
    state: "ASK_SCORE_URL",
    submissionDraft: { audioUrl },
  });
  return replyText(replyToken, "コード譜のURLは？（なければ「なし」）");
}

async function onScoreUrl(userId: string, replyToken: string, text: string) {
  const scoreUrl = (text === "なし") ? "" : text;
  await updateUserState(userId, {
    state: "ASK_REFERENCE_URL_1",
    submissionDraft: { scoreUrl },
  });
  return replyText(replyToken, "参考動画①のURLは？（なければ「なし」）");
}

async function onReferenceUrl1(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      state: "ASK_PARTS",
      submissionDraft: {
        referenceUrl1: "",
        referenceUrl2: "",
        referenceUrl3: "",
        referenceUrl4: "",
        referenceUrl5: "",
        parts: [...DefaultInstrumentalParts],
      },
    });
    return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", [...DefaultInstrumentalParts]);
  }

  await updateUserState(userId, {
    state: "ASK_REFERENCE_URL_2",
    submissionDraft: { referenceUrl1: text },
  });
  return replyText(replyToken, "参考動画②のURLは？（なければ「なし」）");
}

async function onReferenceUrl2(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      state: "ASK_PARTS",
      submissionDraft: {
        referenceUrl2: "",
        referenceUrl3: "",
        referenceUrl4: "",
        referenceUrl5: "",
        parts: [...DefaultInstrumentalParts],
      },
    });
    return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", [...DefaultInstrumentalParts]);
  }

  await updateUserState(userId, {
    state: "ASK_REFERENCE_URL_3",
    submissionDraft: { referenceUrl2: text },
  });
  return replyText(replyToken, "参考動画③のURLは？（なければ「なし」）");
}

async function onReferenceUrl3(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      state: "ASK_PARTS",
      submissionDraft: {
        referenceUrl3: "",
        referenceUrl4: "",
        referenceUrl5: "",
        parts: [...DefaultInstrumentalParts],
      },
    });
    return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", [...DefaultInstrumentalParts]);
  }

  await updateUserState(userId, {
    state: "ASK_REFERENCE_URL_4",
    submissionDraft: { referenceUrl3: text },
  });
  return replyText(replyToken, "参考動画④のURLは？（なければ「なし」）");
}

async function onReferenceUrl4(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      state: "ASK_PARTS",
      submissionDraft: {
        referenceUrl4: "",
        referenceUrl5: "",
        parts: [...DefaultInstrumentalParts],
      },
    });
    return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", [...DefaultInstrumentalParts]);
  }

  await updateUserState(userId, {
    state: "ASK_REFERENCE_URL_5",
    submissionDraft: { referenceUrl4: text },
  });
  return replyText(replyToken, "参考動画⑤のURLは？（なければ「なし」）");
}

async function onReferenceUrl5(userId: string, replyToken: string, text: string) {
  const referenceUrl5 = (text === "なし") ? "" : text;
  await updateUserState(userId, {
    state: "ASK_PARTS",
    submissionDraft: {
      referenceUrl5,
      parts: [...DefaultInstrumentalParts],
    },
  });

  return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", [...DefaultInstrumentalParts]);
}

async function onParts(userId: string, replyToken: string, text: string) {
  const user = await getUser(userId);
  const currentParts = user.submissionDraft?.parts || [];

  if (text === "選択終了") {
    if (currentParts.length === 0) {
      return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", currentParts, undefined, "最低一つは楽器を選んでね。");
    }
    await updateUserState(userId, {
      state: "ASK_MY_PARTS",
      submissionDraft: {
        myParts: [],
      },
    });
    return replyPartsFlex(replyToken, "自分が担当する楽器を選んでね（複数可）", [], currentParts);
  }

  const part = text as InstrumentalPart;
  if (!InstrumentalParts.includes(part)) {
    return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", currentParts, undefined, "ボタンから選んでね。");
  }

  const newParts = currentParts.includes(part)
    ? currentParts.filter(p => p !== part)
    : [...currentParts, part];

  await updateUserState(userId, {
    submissionDraft: {
      parts: newParts,
    },
  });

  return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", newParts);
}

async function onMyParts(userId: string, replyToken: string, text: string) {
  const user = await getUser(userId);
  const currentMyParts = user.submissionDraft?.myParts || [];
  const requiredParts = user.submissionDraft?.parts || [];

  if (text === "選択終了") {
    if (currentMyParts.length === 0) {
      return replyPartsFlex(replyToken, "自分が担当する楽器を選んでね（複数可）", currentMyParts, requiredParts, "最低一つは自分の担当楽器を選んでね。");
    }
    await updateUserState(userId, {
      state: "ASK_DESCRIPTION",
    });

    return replyText(replyToken, "その他伝達事項はありますか？（なければ「なし」）");
  }

  const part = text as InstrumentalPart;
  if (!InstrumentalParts.includes(part)) {
    return replyPartsFlex(replyToken, "自分が担当する楽器を選んでね（複数可）", currentMyParts, requiredParts, "ボタンから選んでね. ");
  }

  const newMyParts = currentMyParts.includes(part)
    ? currentMyParts.filter(p => p !== part)
    : [...currentMyParts, part];

  await updateUserState(userId, {
    submissionDraft: {
      myParts: newMyParts,
    },
  });

  return replyPartsFlex(replyToken, "自分が担当する楽器を選んでね（複数可）", newMyParts, requiredParts);
}

async function onDescription(userId: string, replyToken: string, text: string) {
  const description = (text === "なし") ? "" : text;

  await updateUserState(userId, {
    state: "CONFIRM",
    submissionDraft: { description },
  });

  const { submissionDraft: draft } = await getUser(userId); // 最新のdraftを取得
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

async function replyPartsFlex(replyToken: string, title: string, selected: InstrumentalPart[], filter?: InstrumentalPart[], beforeText?: string) {
  const message = createPartsFlexMessage(title, selected, filter);
  return replyFlexMessage(replyToken, message, beforeText);
}

