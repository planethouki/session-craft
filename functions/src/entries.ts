import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { InstrumentalPart, SessionStatus } from "./types";
import { checkUserApproved } from "./validations/user";
import { validateInstrument } from "./validations/instrument";

const db = admin.firestore()

export const createEntries = onCall<{
  sessionId: string
  entries: {
    songId: string
    part: InstrumentalPart
  }[]
}, Promise<{ ok: boolean }>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User is not authenticated')
    }

    const { sessionId, entries } = request.data
    if (!sessionId || !entries) {
      throw new HttpsError('invalid-argument', 'Missing required fields')
    }

    await checkUserApproved(uid)

    // Validate entries
    for (const entry of entries) {
      validateInstrument(entry.part)
    }

    const sessionRef = db.collection('sessions').doc(sessionId)
    const sessionSnap = await sessionRef.get()
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found')
    }
    const session = sessionSnap.data()
    if (session?.status !== SessionStatus.COLLECTING_ENTRIES) {
      throw new HttpsError('failed-precondition', 'Session is not collecting entries')
    }

    const batch = db.batch()
    const entriesRef = sessionRef.collection('entries')

    // Delete existing entries for this user
    const existingSnap = await entriesRef.where('memberUid', '==', uid).get()
    existingSnap.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Add new entries
    for (const entry of entries) {
      const entryDoc = {
        sessionId,
        songId: entry.songId,
        memberUid: uid,
        part: entry.part,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
      batch.set(entriesRef.doc(), entryDoc)
    }

    await batch.commit()

    return { ok: true }
  }
)

export const getMyEntries = onCall<{
  sessionId: string
}, Promise<{
  entries: any[]
}>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User is not authenticated')
    }

    const { sessionId } = request.data
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'Missing sessionId')
    }

    const entriesRef = db.collection('sessions').doc(sessionId).collection('entries')
    const snapshot = await entriesRef.where('memberUid', '==', uid).get()

    const entries = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        docId: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
      }
    })

    return { entries }
  }
)

export const getEntries = onCall<{
  sessionId: string
}, Promise<{
  entries: any[]
}>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User is not authenticated')
    }

    const { sessionId } = request.data
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'Missing sessionId')
    }

    const sessionRef = db.collection('sessions').doc(sessionId)
    const sessionSnap = await sessionRef.get()
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found')
    }

    const sessionData = sessionSnap.data()
    if (!sessionData) {
      throw new HttpsError('internal', 'Session data is undefined')
    }

    if (sessionData.status !== SessionStatus.PUBLISHED && sessionData.status !== SessionStatus.ADJUSTING_ENTRIES) {
      throw new HttpsError('failed-precondition', 'Session is not published or adjustingEntries')
    }

    const entriesRef = sessionRef.collection('entries')
    const snapshot = await entriesRef.get()

    const entries = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        docId: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
      }
    })

    return { entries }
  }
)
