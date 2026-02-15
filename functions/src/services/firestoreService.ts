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
      ...data,
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
      audioUrl: user.draft?.audioUrl,
      scoreUrl: user.draft?.scoreUrl,
      referenceUrl1: user.draft?.referenceUrl1,
      referenceUrl2: user.draft?.referenceUrl2,
      referenceUrl3: user.draft?.referenceUrl3,
      referenceUrl4: user.draft?.referenceUrl4,
      referenceUrl5: user.draft?.referenceUrl5,
      description: user.draft?.description,
      parts: user.draft?.parts,
      myParts: user.draft?.myParts,
    },
    stateUpdatedAt: user.stateUpdatedAt.toDate(),
  }
}

export async function updateUserState(userId: string, data: Partial<User>): Promise<void> {
  const db = admin.firestore();
  const updateData: any = {
    stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (data.state) updateData.state = data.state;
  if (data.draft) {
    if (data.draft.title !== undefined) updateData["draft.title"] = data.draft.title;
    if (data.draft.artist !== undefined) updateData["draft.artist"] = data.draft.artist;
    if (data.draft.audioUrl !== undefined) updateData["draft.audioUrl"] = data.draft.audioUrl;
    if (data.draft.scoreUrl !== undefined) updateData["draft.scoreUrl"] = data.draft.scoreUrl;
    if (data.draft.referenceUrl1 !== undefined) updateData["draft.referenceUrl1"] = data.draft.referenceUrl1;
    if (data.draft.referenceUrl2 !== undefined) updateData["draft.referenceUrl2"] = data.draft.referenceUrl2;
    if (data.draft.referenceUrl3 !== undefined) updateData["draft.referenceUrl3"] = data.draft.referenceUrl3;
    if (data.draft.referenceUrl4 !== undefined) updateData["draft.referenceUrl4"] = data.draft.referenceUrl4;
    if (data.draft.referenceUrl5 !== undefined) updateData["draft.referenceUrl5"] = data.draft.referenceUrl5;
    if (data.draft.description !== undefined) updateData["draft.description"] = data.draft.description;
    if (data.draft.parts !== undefined) updateData["draft.parts"] = data.draft.parts;
    if (data.draft.myParts !== undefined) updateData["draft.myParts"] = data.draft.myParts;
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
    audioUrl: data.audioUrl,
    scoreUrl: data.scoreUrl,
    referenceUrl1: data.referenceUrl1,
    referenceUrl2: data.referenceUrl2,
    referenceUrl3: data.referenceUrl3,
    referenceUrl4: data.referenceUrl4,
    referenceUrl5: data.referenceUrl5,
    description: data.description,
    parts: data.parts || [],
    myParts: data.myParts || [],
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

export async function getSubmissions(sessionId: string): Promise<Submission[]> {
  const db = admin.firestore();
  const subsSnap = await db.collection('submissions')
    .where('sessionId', '==', sessionId)
    .get();

  return subsSnap
    .docs
    .map(doc => {
      const data = doc.data();
      return {
        sessionId: data.sessionId,
        userId: data.userId,
        titleRaw: data.titleRaw,
        artistRaw: data.artistRaw,
        audioUrl: data.audioUrl,
        scoreUrl: data.scoreUrl,
        referenceUrl1: data.referenceUrl1,
        referenceUrl2: data.referenceUrl2,
        referenceUrl3: data.referenceUrl3,
        referenceUrl4: data.referenceUrl4,
        referenceUrl5: data.referenceUrl5,
        description: data.description,
        parts: data.parts || [],
        myParts: data.myParts || [],
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Submission;
    })
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function createSubmission(submission: Omit<Submission, 'createdAt' | 'updatedAt'>): Promise<void> {
  const db = admin.firestore();
  const subId = `${submission.sessionId}_${submission.userId}`;
  const subRef = db.doc(`submissions/${subId}`);

  const now = admin.firestore.FieldValue.serverTimestamp();
  await subRef.set({
    ...submission,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
}

export async function deleteSubmission(sessionId: string, userId: string): Promise<void> {
  const db = admin.firestore();
  const subId = `${sessionId}_${userId}`;
  await db.doc(`submissions/${subId}`).delete();
}
