import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getCurrentSession, getSubmissions, getUser } from "./services/firestoreService";

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
    const sessionTitle = session.title;
    const sessionDescription = session.description;
    const submissions = await getSubmissions(sessionId);

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

    const data = await Promise.all(submissions.map(async (sub, index) => {
      const userName = await getCachedUserName(sub.userId);

      return {
        ...sub,
        userId: undefined,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
        userName,
        no: index + 1,
      };
    }));

    return {
      sessionTitle,
      sessionDescription,
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
