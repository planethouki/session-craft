import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getCurrentSession, getSubmissions, getUser, getEntriesBySession } from "./services/firestoreService";
import { InstrumentalParts } from "./types/InstrumentalPart";
import { Entry } from "./types/Entry";

export const getSubmissionsApi = onCall({
  secrets: [],
}, async (request) => {
  logger.info("getSubmissionsApi requested");

  try {
    const session = await getCurrentSession();
    if (!session) {
      throw new HttpsError("not-found", "Active session not found");
    }

    const sessionId = session.sessionId;
    const submissions = await getSubmissions(sessionId);
    const entriesBySession = await getEntriesBySession(sessionId);

    // ユーザー名のキャッシュ
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

    const data = await Promise.all(submissions.map(async (sub) => {
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

      const partsStatus = InstrumentalParts.map(part => {
        const isRequired = sub.parts.includes(part as any);
        const members = partEntries[part] || [];
        return {
          part,
          isRequired,
          members,
        };
      });

      return {
        ...sub,
        userName,
        partsStatus,
      };
    }));

    return {
      sessionId,
      submissions: data,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error("Error in getSubmissionsApi", error);
    throw new HttpsError("internal", "Internal Server Error");
  }
});
