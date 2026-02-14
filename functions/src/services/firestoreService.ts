import * as admin from 'firebase-admin'
import {UserState, UserStates} from "../types/UserState";
import { User } from "../types/User";

export async function getUser(userId: string): Promise<User> {
  const db = admin.firestore();
  const userRef = db.doc(`users/${userId}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    const activeSessionId = await getActiveSessionId();
    return {
      state: "IDLE",
      draft: {},
      activeSessionId,
      stateUpdatedAt: new Date(),
    }
  }

  const user = userSnap.data();

  if (!user) {
    const activeSessionId = await getActiveSessionId();
    return {
      state: "IDLE",
      draft: {},
      activeSessionId,
      stateUpdatedAt: new Date(),
    }
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

export async function getActiveSessionId(): Promise<string> {
  const db = admin.firestore();
  const sessionSnap = await db.doc('sessions/current').get();
  if (!sessionSnap.exists) throw new Error("No active session");
  return sessionSnap.data()?.sessionId || "unknown";
}
