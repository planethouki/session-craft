import { google } from "googleapis";
import { getSubmissions, getUser, getEntriesBySession } from "./firestoreService";
import { Entry } from "../types/Entry";
import { InstrumentalParts } from "../types/InstrumentalPart";

// Google Sheetsのシート名制約に合わせて最低限サニタイズ
function toSheetTitle(sessionId: string): string {
  // 禁止文字: : \ / ? * [ ]
  const sanitized = sessionId.replace(/[:\\/?*\[\]]/g, "_").trim();

  // 空は避ける
  const nonEmpty = sanitized.length > 0 ? sanitized : "session";

  // 長すぎる場合は切る（上限100文字）
  return nonEmpty.length > 100 ? nonEmpty.slice(0, 100) : nonEmpty;
}

async function ensureSheetExists(
  sheetsApi: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetTitle: string,
) {
  const meta = await sheetsApi.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });

  const existing = meta.data.sheets?.some((s) => s.properties?.title === sheetTitle) ?? false;
  if (existing) return;

  await sheetsApi.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetTitle,
            },
          },
        },
      ],
    },
  });
}

export async function updateSpreadsheetSubmissions(sessionId: string, spreadsheetIds: string[]) {
  if (!spreadsheetIds || spreadsheetIds.length === 0) return;

  const submissions = await getSubmissions(sessionId);

  // ユーザー情報を取得して表示名を補完
  const rows = await Promise.all(submissions.map(async (sub) => {
      let userName = "";
      try {
        const user = await getUser(sub.userId);
        userName = user.nickname || user.displayName || sub.userId;
      } catch (e) {
        userName = sub.userId;
      }

      return [
        sub.title,
        sub.artist,
        userName,
        sub.parts.join(", "),
        sub.myParts.join(", "),
        sub.audioUrl || "",
        sub.scoreUrl || "",
        sub.referenceUrl1 || "",
        sub.referenceUrl2 || "",
        sub.referenceUrl3 || "",
        sub.referenceUrl4 || "",
        sub.referenceUrl5 || "",
        sub.description || "",
        sub.createdAt.toLocaleString("ja-JP"),
      ];
  }));

  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const header = [
    "曲名",
    "アーティスト",
    "提出者",
    "必要楽器",
    "担当楽器",
    "音源URL",
    "コード譜URL",
    "参考URL1",
    "参考URL2",
    "参考URL3",
    "参考URL4",
    "参考URL5",
    "備考",
    "提出日時",
  ];

  const values = [header, ...rows];

  const sheetTitle = toSheetTitle(sessionId);

  for (const spreadsheetId of spreadsheetIds) {
    try {
      await ensureSheetExists(sheets, spreadsheetId, sheetTitle);

      // 一旦全クリアして書き込む（単純化のため）
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetTitle}!A1:Z1000`,
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values,
        },
      });
    } catch (error) {
      console.error(`Error updating spreadsheet ${spreadsheetId}:`, error);
    }
  }
}

export async function updateSpreadsheetEntries(sessionId: string, spreadsheetIds: string[]) {
  if (!spreadsheetIds || spreadsheetIds.length === 0) return;

  const submissions = await getSubmissions(sessionId);
  const entriesBySession = await getEntriesBySession(sessionId);

  // ユーザー情報のキャッシュ
  const userCache: { [key: string]: string } = {};
  const getCachedUserName = async (userId: string) => {
    if (userCache[userId]) return userCache[userId];
    try {
      const user = await getUser(userId);
      userCache[userId] = user.nickname || user.displayName || userId;
    } catch (e) {
      userCache[userId] = userId;
    }
    return userCache[userId];
  };

  const rows = await Promise.all(submissions.map(async (sub) => {
    const songEntries = entriesBySession.filter((e: Entry) => e.submissionUserId === sub.userId && e.sessionId === sub.sessionId);
    const userName = await getCachedUserName(sub.userId);

    // パートごとにエントリーしている人を集計
    const partEntries: { [key: string]: string[] } = {};
    for (const entry of songEntries) {
      const entryUserName = await getCachedUserName(entry.userId);
      for (const part of entry.parts) {
        if (!partEntries[part]) partEntries[part] = [];
        partEntries[part].push(entryUserName);
      }
    }

    const partColumns = InstrumentalParts.map(part => {
      const members = partEntries[part] || [];
      return members.join(", ");
    });

    return [
      sub.title,
      sub.artist,
      userName,
      ...partColumns,
      sub.audioUrl || "",
      sub.scoreUrl || "",
      sub.referenceUrl1 || "",
      sub.referenceUrl2 || "",
      sub.referenceUrl3 || "",
      sub.referenceUrl4 || "",
      sub.referenceUrl5 || "",
      sub.description || "",
    ];
  }));

  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const header = [
    "曲名",
    "アーティスト",
    "提出者",
    ...InstrumentalParts,
    "音源URL",
    "コード譜URL",
    "参考URL1",
    "参考URL2",
    "参考URL3",
    "参考URL4",
    "参考URL5",
    "備考",
  ];

  const values = [header, ...rows];

  const sheetTitle = toSheetTitle(sessionId);

  for (const spreadsheetId of spreadsheetIds) {
    try {
      await ensureSheetExists(sheets, spreadsheetId, sheetTitle);

      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetTitle}!A1:Z1000`,
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values,
        },
      });
    } catch (error) {
      console.error(`Error updating entry spreadsheet ${spreadsheetId}:`, error);
    }
  }
}
