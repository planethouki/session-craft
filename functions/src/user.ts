import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

const db = admin.firestore()

export const getUser = onCall<unknown, Promise<any>>({ cors: true }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User is not authenticated')
  const userSnap = await db.collection('users').doc(uid).get()
  const user = userSnap.data()
  if (!user) throw new HttpsError('not-found', 'User is not found')
  return {
    docId: userSnap.id,
    ...user,
  }
});

// Callable: Approve self with 6-digit code
export const approveWithCode = onCall<{ code: string }, Promise<{ ok: boolean }>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new Error('unauthenticated')
    }
    const code = (request.data?.code || '').trim()
    if (!code) {
      throw new Error('code is required')
    }
    // TODO パスコードをfirestoreから取得する
    const required = "123456"
    if (!required) {
      throw new Error('APPROVAL_CODE is not configured')
    }
    if (code !== required) {
      return { ok: false }
    }
    await db.collection('users').doc(uid).set({ approved: true, approvedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    return { ok: true }
  }
)

// Callable: Delete own account and data
export const deleteSelf = onCall<unknown, Promise<{ ok: boolean }>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new Error('unauthenticated')

    // delete user doc
    await db.collection('users').doc(uid).delete().catch(() => {})

    // Optionally delete proposals and entries authored by the user (best effort)
    const sessionsSnap = await db.collection('sessions').get()
    const batch = db.batch()
    for (const s of sessionsSnap.docs) {
      const props = await s.ref.collection('proposals').where('proposerUid', '==', uid).get()
      props.docs.forEach((d) => batch.delete(d.ref))
      const entries = await s.ref.collection('entries').where('memberUid', '==', uid).get()
      entries.docs.forEach((d) => batch.delete(d.ref))
    }
    await batch.commit().catch(() => {})

    // delete auth user
    await admin.auth().deleteUser(uid)

    return { ok: true }
  }
)
