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

