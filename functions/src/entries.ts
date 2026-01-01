import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { InstrumentalPart } from "./types";

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

    const sessionRef = db.collection('sessions').doc(sessionId)
    const sessionSnap = await sessionRef.get()
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found')
    }
    const session = sessionSnap.data()
    if (session?.status !== 'collectingEntries') {
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
      }
      batch.set(entriesRef.doc(), entryDoc)
    }

    await batch.commit()

    return { ok: true }
  }
)

