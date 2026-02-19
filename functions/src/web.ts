import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getCurrentSession, getSubmissions, getUser, isAdmin, updateSessionState } from "./services/firestoreService";
import { SessionState, SessionStates } from "./types/SessionState";

export const updateSessionStateApi = onCall({
  secrets: [],
}, async (request) => {
  logger.info("updateSessionStateApi requested");

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  if (!(await isAdmin(request.auth.uid))) {
    throw new HttpsError("permission-denied", "The function must be called by an admin.");
  }

  const state = request.data.state as SessionState;
  if (!SessionStates.includes(state)) {
    throw new HttpsError("invalid-argument", "The function must be called with a valid state.");
  }

  try {
    await updateSessionState(state);
    return { success: true };
  } catch (error) {
    logger.error("Error in updateSessionStateApi", error);
    throw new HttpsError("internal", "Internal Server Error");
  }
});

export const getCurrentSessionApi = onCall({
  secrets: [],
}, async (request) => {
  logger.info("getCurrentSessionApi requested");

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  if (!(await isAdmin(request.auth.uid))) {
    throw new HttpsError("permission-denied", "The function must be called by an admin.");
  }

  try {
    const session = await getCurrentSession();
    if (!session) {
      throw new HttpsError("not-found", "Active session not found");
    }

    return {
      ...session,
      sessionDate: session.sessionDate.toISOString(),
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error("Error in getCurrentSessionApi", error);
    throw new HttpsError("internal", "Internal Server Error");
  }
});


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
