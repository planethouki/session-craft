import * as admin from 'firebase-admin'
import { UserState, UserStates } from "../types/UserState";
import { User } from "../types/User";
import { Submission } from "../types/Submission";
import { Session } from "../types/Session";
import { Entry } from "../types/Entry";

export async function getUser(userId: string): Promise<User> {
  const db = admin.firestore();
  const userRef = db.doc(`users/${userId}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error(`User ${userId} not found`);
  }

  const user = userSnap.data();

  if (!user) {
    throw new Error("User data is empty");
  }

  const state: UserState = UserStates.includes(user.state) ? user.state : "IDLE";

  return {
    state,
    submissionDraft: {
      title: user.submissionDraft?.title,
      artist: user.submissionDraft?.artist,
      audioUrl: user.submissionDraft?.audioUrl,
      scoreUrl: user.submissionDraft?.scoreUrl,
      referenceUrl1: user.submissionDraft?.referenceUrl1,
      referenceUrl2: user.submissionDraft?.referenceUrl2,
      referenceUrl3: user.submissionDraft?.referenceUrl3,
      referenceUrl4: user.submissionDraft?.referenceUrl4,
      referenceUrl5: user.submissionDraft?.referenceUrl5,
      description: user.submissionDraft?.description,
      parts: user.submissionDraft?.parts,
      myParts: user.submissionDraft?.myParts,
    },
    entryDraft: {
      submissionUserId: user.entryDraft?.submissionUserId,
      songTitle: user.entryDraft?.songTitle,
      parts: user.entryDraft?.parts,
    },
    stateUpdatedAt: user.stateUpdatedAt.toDate(),
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    profileUpdatedAt: user.profileUpdatedAt?.toDate() || new Date(0),
    nickname: user.nickname || "",
  }
}

export async function updateUserState(userId: string, data: Partial<User>): Promise<void> {
  const db = admin.firestore();
  const updateData: any = {
    stateUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (data.state) updateData.state = data.state;
  if (data.submissionDraft) {
    if (data.submissionDraft.title !== undefined) updateData["submissionDraft.title"] = data.submissionDraft.title;
    if (data.submissionDraft.artist !== undefined) updateData["submissionDraft.artist"] = data.submissionDraft.artist;
    if (data.submissionDraft.audioUrl !== undefined) updateData["submissionDraft.audioUrl"] = data.submissionDraft.audioUrl;
    if (data.submissionDraft.scoreUrl !== undefined) updateData["submissionDraft.scoreUrl"] = data.submissionDraft.scoreUrl;
    if (data.submissionDraft.referenceUrl1 !== undefined) updateData["submissionDraft.referenceUrl1"] = data.submissionDraft.referenceUrl1;
    if (data.submissionDraft.referenceUrl2 !== undefined) updateData["submissionDraft.referenceUrl2"] = data.submissionDraft.referenceUrl2;
    if (data.submissionDraft.referenceUrl3 !== undefined) updateData["submissionDraft.referenceUrl3"] = data.submissionDraft.referenceUrl3;
    if (data.submissionDraft.referenceUrl4 !== undefined) updateData["submissionDraft.referenceUrl4"] = data.submissionDraft.referenceUrl4;
    if (data.submissionDraft.referenceUrl5 !== undefined) updateData["submissionDraft.referenceUrl5"] = data.submissionDraft.referenceUrl5;
    if (data.submissionDraft.description !== undefined) updateData["submissionDraft.description"] = data.submissionDraft.description;
    if (data.submissionDraft.parts !== undefined) updateData["submissionDraft.parts"] = data.submissionDraft.parts;
    if (data.submissionDraft.myParts !== undefined) updateData["submissionDraft.myParts"] = data.submissionDraft.myParts;
    if (Object.keys(data.submissionDraft).length === 0) updateData.submissionDraft = {};
  }
  if (data.entryDraft) {
    if (data.entryDraft.submissionUserId !== undefined) updateData["entryDraft.submissionUserId"] = data.entryDraft.submissionUserId;
    if (data.entryDraft.songTitle !== undefined) updateData["entryDraft.songTitle"] = data.entryDraft.songTitle;
    if (data.entryDraft.parts !== undefined) updateData["entryDraft.parts"] = data.entryDraft.parts;
    if (Object.keys(data.entryDraft).length === 0) updateData.entryDraft = {};
  }

  await db.doc(`users/${userId}`).update(updateData);
}

// ユーザーの作成または完全な上書き（merge: true）が必要な場合用
export async function setUser(userId: string, user: Partial<User>): Promise<void> {
  const db = admin.firestore();
  const data: any = {
    ...user,
  };
  if (user.state) {
    data.stateUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
  }
  if (user.displayName || user.photoURL) {
    data.profileUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
  }
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
    title: data.title,
    artist: data.artist,
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
        title: data.title,
        artist: data.artist,
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

export async function deleteEntriesBySubmission(sessionId: string, submissionUserId: string): Promise<void> {
  const db = admin.firestore();
  const entriesSnap = await db.collection('entries')
    .where('sessionId', '==', sessionId)
    .where('submissionUserId', '==', submissionUserId)
    .get();

  const batch = db.batch();
  entriesSnap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

export async function deleteEntry(sessionId: string, submissionUserId: string, userId: string): Promise<void> {
  const db = admin.firestore();
  const entryId = `${sessionId}_${submissionUserId}_${userId}`;
  await db.doc(`entries/${entryId}`).delete();
}

export async function createOrUpdateEntry(entry: Omit<Entry, 'createdAt' | 'updatedAt'>): Promise<void> {
  const db = admin.firestore();
  const entryId = `${entry.sessionId}_${entry.submissionUserId}_${entry.userId}`;
  const entryRef = db.doc(`entries/${entryId}`);

  const now = admin.firestore.FieldValue.serverTimestamp();
  const entrySnap = await entryRef.get();

  if (entrySnap.exists) {
    await entryRef.update({
      parts: entry.parts,
      updatedAt: now,
    });
  } else {
    await entryRef.set({
      ...entry,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function getEntry(sessionId: string, submissionUserId: string, entryUserId: string): Promise<Entry | null> {
  const db = admin.firestore();
  const entryId = `${sessionId}_${submissionUserId}_${entryUserId}`;
  const entrySnap = await db.doc(`entries/${entryId}`).get();

  if (!entrySnap.exists) return null;
  const data = entrySnap.data();
  if (!data) return null;

  return {
    sessionId: data.sessionId,
    submissionUserId: data.submissionUserId,
    userId: data.userId,
    parts: data.parts || [],
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

export async function getEntriesBySession(sessionId: string): Promise<Entry[]> {
  const db = admin.firestore();
  const entriesSnap = await db.collection('entries')
    .where('sessionId', '==', sessionId)
    .get();

  return entriesSnap.docs.map(doc => {
    const data = doc.data();
    return {
      sessionId: data.sessionId,
      submissionUserId: data.submissionUserId,
      userId: data.userId,
      parts: data.parts || [],
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Entry;
  });
}

export async function getEntriesByUser(sessionId: string, userId: string): Promise<Entry[]> {
  const db = admin.firestore();
  const entriesSnap = await db.collection('entries')
    .where('sessionId', '==', sessionId)
    .where('userId', '==', userId)
    .get();

  return entriesSnap.docs.map(doc => {
    const data = doc.data();
    return {
      sessionId: data.sessionId,
      submissionUserId: data.submissionUserId,
      userId: data.userId,
      parts: data.parts || [],
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Entry;
  });
}
