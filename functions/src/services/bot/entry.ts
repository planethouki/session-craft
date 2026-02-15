import {
  getUser,
  getActiveSessionId,
  updateUserState,
  getSubmissions,
  getEntry,
  createOrUpdateEntry,
  getEntriesByUser,
  getEntriesBySession,
} from "../firestoreService";
import { replyText, replyFlexMessage } from "../messageService";
import { InstrumentalParts, InstrumentalPart } from "../../types/InstrumentalPart";
import { createPartsFlexMessage } from "../../utils/flexButton";

export async function handleEntry(userId: string, replyToken: string, text: string) {
  // 共通コマンド
  if (text === "キャンセル") return resetState(userId, replyToken, "キャンセルしたよ。");
  if (text === "状況") return replyMyEntries(userId, replyToken);
  if (text === "一覧") return replyEntryList(replyToken);

  const user = await getUser(userId);

  if (user.state === "SELECT_ENTRY_PART") {
    return onSelectPart(userId, replyToken, text);
  }

  // IDLE状態など
  if (text === "エントリー" || text === "参加") {
    return replySongList(replyToken);
  }

  // 「1」「エントリー 1」などの曲選択
  const songNumberMatch = text.match(/^(?:エントリー\s*)?(\d+)$/);
  if (songNumberMatch) {
    const songIndex = parseInt(songNumberMatch[1]) - 1;
    return startEntryForSong(userId, replyToken, songIndex);
  }

  return replyHelp(replyToken);
}

async function replySongList(replyToken: string) {
  const sessionId = await getActiveSessionId();
  const subs = await getSubmissions(sessionId);

  if (subs.length === 0) {
    return replyText(replyToken, "まだ曲が提出されていないよ。");
  }

  const list = subs.map((s, i) => `${i + 1}. ${s.title} / ${s.artist}`).join("\n");
  const message = [
    "エントリーしたい曲の番号を教えてね（例：1）",
    "",
    list,
  ].join("\n");

  return replyText(replyToken, message);
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

  const detail = [
    `曲名: ${song.title}`,
    `アーティスト: ${song.artist}`,
    `音源: ${song.audioUrl || "なし"}`,
    `必要楽器: ${song.parts.join(", ")}`,
  ].join("\n");

  return replyPartsFlex(replyToken, `${song.title} にエントリー`, selectedParts, song.parts, detail);
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
    "「キャンセル」で中断できるよ。",
  ].join("\n");
  return replyText(replyToken, message);
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

async function replyEntryList(replyToken: string) {
  const sessionId = await getActiveSessionId();
  const subs = await getSubmissions(sessionId);
  const entries = await getEntriesBySession(sessionId);

  if (subs.length === 0) {
    return replyText(replyToken, "まだ曲が提出されていないよ。");
  }

  const lines = subs.map((song, i) => {
    const songEntries = entries.filter(e => e.submissionUserId === song.userId);
    const entryDetails = songEntries.map(e => {
      // 本来はユーザー名を表示したいが、ここでは簡易的にIDを表示するか、
      // ユーザー情報を別途取得する必要がある。
      // 今回は一旦「誰かがエントリー中」というニュアンスで。
      return `${e.parts.join(", ")}`;
    }).filter(s => s.length > 0);

    return `${i + 1}. ${song.title} [${song.parts.join("/")}]\n   エントリー: ${entryDetails.join(" / ") || "なし"}`;
  });

  return replyText(replyToken, `現在の全体エントリー状況：\n${lines.join("\n\n")}`);
}
