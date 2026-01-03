import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

const db = admin.firestore()

type CreateSessionData = {
  title: string
  date: string
}

export const adminCreateSession = onCall<CreateSessionData, Promise<void>>({ cors: true }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User is not authenticated')
  const userSnap = await db.collection('users').doc(uid).get()
  const user = userSnap.data()
  if (!user) throw new HttpsError('not-found', 'User is not found')
  if (!(user.roles && user.roles.includes('admin'))) {
    throw new HttpsError('permission-denied', 'User is not an admin')
  }
  const now = admin.firestore.FieldValue.serverTimestamp()
  await db.collection('sessions').add({
    title: request.data.title.trim(),
    date: request.data.date.trim(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  })
});

export const adminGetSession = onCall<{ sessionId: string }, Promise<any>>({ cors: true }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User is not authenticated')
  const userSnap = await db.collection('users').doc(uid).get()
  const user = userSnap.data()
  if (!user) throw new HttpsError('not-found', 'User is not found')
  if (!(user.roles && user.roles.includes('admin'))) {
    throw new HttpsError('permission-denied', 'User is not an admin')
  }

  const sessionSnap = await db.collection('sessions').doc(request.data.sessionId).get()
  if (!sessionSnap.exists) throw new HttpsError('not-found', 'Session not found')

  const data = sessionSnap.data()
  if (!data) throw new HttpsError('internal', 'Session data is undefined')

  const [entriesSnap, proposalsSnap] = await Promise.all([
    sessionSnap.ref.collection('entries').get(),
    sessionSnap.ref.collection('proposals').get(),
  ])

  const entries: any[] = []
  const proposals: any[] = []

  if (!entriesSnap.empty) {
    entriesSnap.docs.forEach(doc => {
      const data = doc.data()
      entries.push({
        docId: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
      })
    })
  }

  if (!proposalsSnap.empty) {
    proposalsSnap.docs.forEach(doc => {
      const data = doc.data()
      proposals.push({
        docId: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
      })
    })
  }

  return {
    docId: sessionSnap.id,
    ...data,
    createdAt: data.createdAt.toMillis(),
    updatedAt: data.updatedAt.toMillis(),
    entries,
    proposals,
  }
})

export const adminUpdateSelectedProposals = onCall<{ sessionId: string, proposalIds: string[] }, Promise<void>>({ cors: true }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User is not authenticated')
  const userSnap = await db.collection('users').doc(uid).get()
  const user = userSnap.data()
  if (!user) throw new HttpsError('not-found', 'User is not found')
  if (!(user.roles && user.roles.includes('admin'))) {
    throw new HttpsError('permission-denied', 'User is not an admin')
  }

  const { sessionId, proposalIds } = request.data
  const sessionRef = db.collection('sessions').doc(sessionId)
  const sessionSnap = await sessionRef.get()
  if (!sessionSnap.exists) throw new HttpsError('not-found', 'Session not found')

  await sessionRef.update({
    selectedProposals: proposalIds,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
})
