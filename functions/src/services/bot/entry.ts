import {
  getUser,
  getActiveSessionId,
  updateUserState,
  getSubmissions,
  getEntry,
  createOrUpdateEntry,
  deleteEntry,
  getEntriesByUser,
} from "../firestoreService";
import { replyText, replyFlexMessage } from "../messageService";
import { InstrumentalParts, InstrumentalPart } from "../../types/InstrumentalPart";
import { createPartsFlexMessage, createSelectionFlexMessage } from "../../utils/flexButton";

export async function handleEntry(userId: string, replyToken: string, text: string) {
  // 共通コマンド
  if (text === "キャンセル") return resetState(userId, replyToken, "キャンセルしたよ。");
  if (text === "状況") return replyMyEntries(userId, replyToken);

  const user = await getUser(userId);

  if (user.state === "SELECT_ENTRY_SONG") {
    const songNumberMatch = text.match(/^\d+$/);
    if (songNumberMatch) {
      const songIndex = parseInt(songNumberMatch[0]) - 1;
      return startEntryForSong(userId, replyToken, songIndex);
    }
    return replySongList(replyToken, "曲の番号を教えてね。");
  }

  if (user.state === "SELECT_ENTRY_PART") {
    return onSelectPart(userId, replyToken, text);
  }

  // IDLE状態など
  if (text === "エントリー" || text === "参加") {
    await updateUserState(userId, { state: "SELECT_ENTRY_SONG" });
    return replySongList(replyToken);
  }

  if (text === "削除") {
    return replyDeleteSelection(userId, replyToken);
  }

  // 「削除 1」などの削除実行
  const deleteMatch = text.match(/^削除\s*(\d+)$/);
  if (deleteMatch) {
    const entryIndex = parseInt(deleteMatch[1]) - 1;
    return executeDeleteEntry(userId, replyToken, entryIndex);
  }

  return replyHelp(replyToken);
}

async function replySongList(replyToken: string, beforeText?: string) {
  const sessionId = await getActiveSessionId();
  const subs = await getSubmissions(sessionId);

  if (subs.length === 0) {
    return replyText(replyToken, "まだ曲が提出されていないよ。");
  }

  const list = subs.map((s, i) => {
    let text = `${i + 1}. ${s.title} / ${s.artist} [${s.parts.join("/")}]`;
    const urls: string[] = [];
    if (s.audioUrl) urls.push(`音源: ${s.audioUrl}`);
    if (s.scoreUrl) urls.push(`譜面: ${s.scoreUrl}`);
    if (s.referenceUrl1) urls.push(`参考1: ${s.referenceUrl1}`);
    if (s.referenceUrl2) urls.push(`参考2: ${s.referenceUrl2}`);
    if (s.referenceUrl3) urls.push(`参考3: ${s.referenceUrl3}`);
    if (s.referenceUrl4) urls.push(`参考4: ${s.referenceUrl4}`);
    if (s.referenceUrl5) urls.push(`参考5: ${s.referenceUrl5}`);

    if (urls.length > 0) {
      text += "\n" + urls.map(u => `   ${u}`).join("\n");
    }
    return text;
  }).join("\n");
  const message = [
    "エントリーしたい曲の番号を教えてね（例：1）",
    "",
    list,
  ].join("\n");

  return replyText(replyToken, message, beforeText);
}

async function startEntryForSong(userId: string, replyToken: string, songIndex: number) {
  const sessionId = await getActiveSessionId();
  const subs = await getSubmissions(sessionId);

  if (songIndex < 0 || songIndex >= subs.length) {
    return replyText(replyToken, "無効な番号だよ。");
  }

  const song = subs[songIndex];
  const entry = await getEntry(sessionId, song.userId, userId);
  const selectedParts = entry ? entry.parts : [];

  // UserStateを更新して、どの曲に対してエントリー中かを保持する。
  await updateUserState(userId, {
    state: "SELECT_ENTRY_PART",
    entryDraft: {
      submissionUserId: song.userId, // submissionUserIdを保持
      songTitle: song.title, // 曲名を保持（表示用）
      parts: selectedParts,
    }
  });

  return replyPartsFlex(replyToken, `${song.title} にエントリー`, selectedParts, song.parts);
}

async function onSelectPart(userId: string, replyToken: string, text: string) {
  const user = await getUser(userId);
  const submissionUserId = user.entryDraft?.submissionUserId || "";
  const songTitle = user.entryDraft?.songTitle || "";
  const currentParts = user.entryDraft?.parts || [];

  // get the song to know required parts
  const sessionId = await getActiveSessionId();
  const subs = await getSubmissions(sessionId);
  const song = subs.find(s => s.userId === submissionUserId && s.title === songTitle);

  if (!song) {
    return resetState(userId, replyToken, "曲が見つからなかったよ。");
  }

  if (text === "エントリー確定") {
    if (currentParts.length === 0) {
      await deleteEntry(sessionId, submissionUserId, userId);
      await updateUserState(userId, { state: "IDLE", entryDraft: {} });
      return replyText(replyToken, `${songTitle} のエントリーを解除したよ。`);
    }
    await createOrUpdateEntry({
      sessionId,
      submissionUserId,
      userId,
      parts: currentParts,
    });
    await updateUserState(userId, { state: "IDLE", entryDraft: {} });
    return replyText(replyToken, `${songTitle} のエントリーを更新したよ！`);
  }

  const part = text as InstrumentalPart;
  if (!InstrumentalParts.includes(part)) {
    return replyPartsFlex(replyToken, `${songTitle} にエントリー`, currentParts, song.parts, "ボタンから選んでね。");
  }

  const newParts = currentParts.includes(part)
    ? currentParts.filter(p => p !== part)
    : [...currentParts, part];

  await updateUserState(userId, {
    entryDraft: {
      ...user.entryDraft,
      parts: newParts,
    },
  });

  return replyPartsFlex(replyToken, `${songTitle} にエントリー`, newParts, song.parts);
}

async function replyPartsFlex(replyToken: string, title: string, selected: InstrumentalPart[], filter?: InstrumentalPart[], beforeText?: string) {
  const message = createPartsFlexMessage(title, selected, filter, "エントリー確定");
  return replyFlexMessage(replyToken, message, beforeText);
}

async function resetState(userId: string, replyToken: string, message: string) {
  await updateUserState(userId, {
    state: "IDLE",
    entryDraft: {},
  });
  return replyText(replyToken, message);
}

async function replyHelp(replyToken: string) {
  const message = [
    "「エントリー」で曲一覧を表示するよ。",
    "曲の番号（例：1）を送ると詳細表示とパート選択ができるよ。",
    "「状況」で自分のエントリーを確認できるよ。",
    "「削除」でエントリーを解除できるよ。",
    "「キャンセル」で中断できるよ。",
  ].join("\n");
  return replyText(replyToken, message);
}

async function replyDeleteSelection(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const entries = await getEntriesByUser(sessionId, userId);
  const subs = await getSubmissions(sessionId);

  if (entries.length === 0) {
    return replyText(replyToken, "まだエントリーしていないよ。");
  }

  const options = entries.map((entry, i) => {
    const song = subs.find(s => s.userId === entry.submissionUserId);
    const songTitle = song ? song.title : "不明な曲";
    return {
      label: `${i + 1}. ${songTitle}`,
      text: `削除 ${i + 1}`,
    };
  });

  const message = createSelectionFlexMessage("解除するエントリーを選択してね", options);
  return replyFlexMessage(replyToken, message);
}

async function executeDeleteEntry(userId: string, replyToken: string, entryIndex: number) {
  const sessionId = await getActiveSessionId();
  const entries = await getEntriesByUser(sessionId, userId);

  if (entryIndex < 0 || entryIndex >= entries.length) {
    return replyText(replyToken, "無効な番号だよ。");
  }

  const entry = entries[entryIndex];
  const subs = await getSubmissions(sessionId);
  const song = subs.find(s => s.userId === entry.submissionUserId);
  const songTitle = song ? song.title : "不明な曲";

  await deleteEntry(sessionId, entry.submissionUserId, userId);

  return replyText(replyToken, `${songTitle} のエントリーを解除したよ。`);
}

async function replyMyEntries(userId: string, replyToken: string) {
  const sessionId = await getActiveSessionId();
  const entries = await getEntriesByUser(sessionId, userId);
  const subs = await getSubmissions(sessionId);

  if (entries.length === 0) {
    return replyText(replyToken, "まだエントリーしていないよ。");
  }

  const lines = entries.map(entry => {
    const song = subs.find(s => s.userId === entry.submissionUserId);
    const songTitle = song ? song.title : "不明な曲";
    return `${songTitle}: ${entry.parts.join(", ")}`;
  });

  return replyText(replyToken, `あなたのエントリー状況：\n${lines.join("\n")}`);
}
