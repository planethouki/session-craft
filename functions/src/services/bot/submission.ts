import {
  getUser,
  getActiveSessionId,
  updateUserState,
  getSubmission,
  getSubmissions,
  createSubmission,
  deleteSubmission,
  getCurrentSession,
  createOrUpdateEntry,
  deleteEntriesBySubmission,
} from "../firestoreService";

import { replyText, replyFlexMessage } from "../messageService";
import { InstrumentalParts, InstrumentalPart, DefaultInstrumentalParts } from "../../types/InstrumentalPart";
import { createPartsFlexMessage, createConfirmFlexMessage } from "../../utils/flexButton";
import { updateSpreadsheetSubmissions } from "../spreadsheetService";

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
    default:
      return resetState(userId, replyToken, "状態が不明だったので最初からやり直そう。『提出』と送ってね。");
  }
}

async function startSubmission(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const sub = await getSubmission(sessionId, userId);

  if (sub) {
    return replyText(replyToken, `今月はすでに提出済みだよ：\n${sub.title} / ${sub.artist}`);
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
    state: "ASK_AUDIO_URL",
    draft: {
      artist,
    },
  });
  return replyText(replyToken, "音源のURLは？（なければ「なし」）");
}

async function onAudioUrl(userId: string, replyToken: string, text: string) {
  const audioUrl = (text === "なし") ? "" : text;
  await updateUserState(userId, {
    state: "ASK_SCORE_URL",
    draft: { audioUrl },
  });
  return replyText(replyToken, "コード譜のURLは？（なければ「なし」）");
}

async function onScoreUrl(userId: string, replyToken: string, text: string) {
  const scoreUrl = (text === "なし") ? "" : text;
  await updateUserState(userId, {
    state: "ASK_REFERENCE_URL_1",
    draft: { scoreUrl },
  });
  return replyText(replyToken, "参考動画①のURLは？（なければ「なし」）");
}

async function onReferenceUrl1(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      state: "ASK_PARTS",
      draft: {
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
    draft: { referenceUrl1: text },
  });
  return replyText(replyToken, "参考動画②のURLは？（なければ「なし」）");
}

async function onReferenceUrl2(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      state: "ASK_PARTS",
      draft: {
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
    draft: { referenceUrl2: text },
  });
  return replyText(replyToken, "参考動画③のURLは？（なければ「なし」）");
}

async function onReferenceUrl3(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      state: "ASK_PARTS",
      draft: {
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
    draft: { referenceUrl3: text },
  });
  return replyText(replyToken, "参考動画④のURLは？（なければ「なし」）");
}

async function onReferenceUrl4(userId: string, replyToken: string, text: string) {
  if (text === "なし") {
    await updateUserState(userId, {
      state: "ASK_PARTS",
      draft: {
        referenceUrl4: "",
        referenceUrl5: "",
        parts: [...DefaultInstrumentalParts],
      },
    });
    return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", [...DefaultInstrumentalParts]);
  }

  await updateUserState(userId, {
    state: "ASK_REFERENCE_URL_5",
    draft: { referenceUrl4: text },
  });
  return replyText(replyToken, "参考動画⑤のURLは？（なければ「なし」）");
}

async function onReferenceUrl5(userId: string, replyToken: string, text: string) {
  const referenceUrl5 = (text === "なし") ? "" : text;
  await updateUserState(userId, {
    state: "ASK_PARTS",
    draft: {
      referenceUrl5,
      parts: [...DefaultInstrumentalParts],
    },
  });

  return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", [...DefaultInstrumentalParts]);
}

async function onParts(userId: string, replyToken: string, text: string) {
  const user = await getUser(userId);
  const currentParts = user.draft.parts || [];

  if (text === "選択終了") {
    if (currentParts.length === 0) {
      return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", currentParts, undefined, "最低一つは楽器を選んでね。");
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
    return replyPartsFlex(replyToken, "必要な楽器を選んでね（複数可）", currentParts, undefined, "ボタンから選んでね。");
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
  const user = await getUser(userId);
  const currentMyParts = user.draft.myParts || [];
  const requiredParts = user.draft.parts || [];

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
    return replyPartsFlex(replyToken, "自分が担当する楽器を選んでね（複数可）", currentMyParts, requiredParts, "ボタンから選んでね。");
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

async function onDescription(userId: string, replyToken: string, text: string) {
  const description = (text === "なし") ? "" : text;

  await updateUserState(userId, {
    state: "CONFIRM",
    draft: { description },
  });

  const { draft } = await getUser(userId); // 最新のdraftを取得
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

  const message = createConfirmFlexMessage("これで登録する？", summary);
  return replyFlexMessage(replyToken, message);
}

async function replyPartsFlex(replyToken: string, title: string, selected: InstrumentalPart[], filter?: InstrumentalPart[], beforeText?: string) {
  const message = createPartsFlexMessage(title, selected, filter);
  return replyFlexMessage(replyToken, message, beforeText);
}

async function onConfirm(userId: string, replyToken: string, text: string) {
  if (text === "最初からやり直す") {
    await updateUserState(userId, { state: "ASK_TITLE", draft: {} });
    return replyText(replyToken, "OK！最初からやり直そう。曲名は？");
  }
  if (text !== "提出する") {
    return replyText(replyToken, "「提出する」か「最初からやり直す」を選んでね。");
  }

  const user = await getUser(userId);
  if (!user) return replyText(replyToken, "エラーが発生しました。");

  const { draft } = user;
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

  // 提出者本人分のEntryドキュメントを自動作成
  await createOrUpdateEntry({
    sessionId,
    submissionUserId: userId,
    userId: userId,
    parts: myParts,
  });

  // スプレッドシート更新
  const session = await getCurrentSession();
  if (session?.spreadsheetIds) {
    await updateSpreadsheetSubmissions(sessionId, session.spreadsheetIds);
  }

  // stateリセット
  await updateUserState(userId, { state: "IDLE", draft: {} });

  return replyText(replyToken, `登録したよ！\n${title} / ${artist}`);
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
    "「キャンセル」で入力を中止できるよ。",
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

async function replyList(replyToken: string) {
  const sessionId = await getActiveSessionId();
  const subs = await getSubmissions(sessionId);

  if (subs.length === 0) {
    return replyText(replyToken, "まだ誰も提出していないよ。");
  }

  const list = subs.map((s, i) => `${i + 1}. ${s.title} / ${s.artist}`).join("\n");
  return replyText(replyToken, `現在の提出一覧：\n${list}`);
}

async function deleteSubmissionCommand(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const sub = await getSubmission(sessionId, userId);

  if (!sub) {
    return replyText(replyToken, "削除する提出がないよ。");
  }

  await deleteSubmission(sessionId, userId);
  await deleteEntriesBySubmission(sessionId, userId);

  // スプレッドシート更新
  const session = await getCurrentSession();
  if (session?.spreadsheetIds) {
    await updateSpreadsheetSubmissions(sessionId, session.spreadsheetIds);
  }

  return replyText(replyToken, "提出を削除したよ。");
}
