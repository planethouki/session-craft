import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

const db = admin.firestore()

export const getSession = onCall<{
  sessionId: string
}, Promise<any>>(
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

    const sessionSnap = await db.collection('sessions').doc(sessionId).get()
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found')
    }

    const sessionData = sessionSnap.data()

    if (!sessionData) {
      throw new HttpsError('internal', 'Session data is undefined')
    }

    const session = sessionData

    delete session.selectedProposals

    return {
      docId: sessionSnap.id,
      ...session,
      createdAt: sessionData.createdAt.toMillis(),
      updatedAt: sessionData.updatedAt.toMillis(),
    }
  }
)
