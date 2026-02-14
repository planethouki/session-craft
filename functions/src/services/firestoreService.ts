import * as admin from 'firebase-admin'
import { UserState, UserStates } from "../types/UserState";
import { User } from "../types/User";
import { Submission } from "../types/Submission";
import { Session } from "../types/Session";

export async function findOrCreateUser(userId: string): Promise<User> {
  const db = admin.firestore();
  const userRef = db.doc(`users/${userId}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    const activeSessionId = await getActiveSessionId();

    const data: any = {
      state: "IDLE",
      draft: {},
      activeSessionId,
      stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(data);

    return {
      state: "IDLE",
      draft: {},
      activeSessionId,
      stateUpdatedAt: new Date(),
    }
  }

  const user = userSnap.data();

  if (!user) {
    throw new Error("User data is empty");
  }

  const state: UserState = UserStates.includes(user.state) ? user.state : "IDLE";

  return {
    state,
    draft: {
      title: user.draft?.title,
      artist: user.draft?.artist,
      url: user.draft?.url,
    },
    activeSessionId: user.activeSessionId,
    stateUpdatedAt: user.stateUpdatedAt.toDate(),
  }
}

export async function updateUserState(userId: string, data: Partial<User>): Promise<void> {
  const db = admin.firestore();
  const updateData: any = {
    stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (data.state) updateData.state = data.state;
  if (data.activeSessionId) updateData.activeSessionId = data.activeSessionId;
  if (data.draft) {
    if (data.draft.title !== undefined) updateData["draft.title"] = data.draft.title;
    if (data.draft.artist !== undefined) updateData["draft.artist"] = data.draft.artist;
    if (data.draft.url !== undefined) updateData["draft.url"] = data.draft.url;
    if (Object.keys(data.draft).length === 0) updateData.draft = {};
  }

  await db.doc(`users/${userId}`).update(updateData);
}

// ユーザーの作成または完全な上書き（merge: true）が必要な場合用
export async function setUser(userId: string, user: Partial<User>): Promise<void> {
  const db = admin.firestore();
  const data: any = {
    ...user,
    stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.doc(`users/${userId}`).set(data, { merge: true });
}

export async function getCurrentSession(): Promise<Session | null> {
  const db = admin.firestore();
  const sessionSnap = await db.doc('sessions/current').get();
  if (!sessionSnap.exists) return null;
  const data = sessionSnap.data();
  if (!data) return null;
  return {
    ...data,
    sessionDate: data.sessionDate.toDate(),
  } as Session;
}

export async function getActiveSessionId(): Promise<string> {
  const s = await getCurrentSession();
  if (!s) throw new Error("No active session");
  return s.sessionId;
}

export async function isSubmissionOpen(): Promise<boolean> {
  const data = await getCurrentSession();
  if (!data) return false;
  return data.state === "SUBMISSION";
}

export async function getSubmission(sessionId: string, userId: string): Promise<Submission | null> {
  const db = admin.firestore();
  const subId = `${sessionId}_${userId}`;
  const subSnap = await db.doc(`submissions/${subId}`).get();

  if (!subSnap.exists) return null;
  const data = subSnap.data();
  if (!data) return null;

  return {
    sessionId: data.sessionId,
    userId: data.userId,
    titleRaw: data.titleRaw,
    artistRaw: data.artistRaw,
    url: data.url,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

export async function createSubmission(submission: Omit<Submission, 'createdAt' | 'updatedAt'>): Promise<void> {
  const db = admin.firestore();
  const subId = `${submission.sessionId}_${submission.userId}`;
  const subRef = db.doc(`submissions/${subId}`);

  await db.runTransaction(async (tx) => {
    const subSnap = await tx.get(subRef);
    if (subSnap.exists) {
      return;
    }
    tx.set(subRef, {
      ...submission,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}
