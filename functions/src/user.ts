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
    createdAt: userSnap.createTime!.toMillis(),
    updatedAt: userSnap.updateTime!.toMillis(),
    approvedAt: user.approvedAt?.toMillis(),
  }
});

// Callable: Approve self with 6-digit code
export const approveWithCode = onCall<{ code: string }, Promise<{ ok: boolean }>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User is not authenticated')
    }
    const code = (request.data?.code || '').trim()
    if (!code) {
      throw new HttpsError('invalid-argument', 'code is required')
    }
    // TODO パスコードをfirestoreから取得する
    const required = "123456"
    if (!required) {
      throw new HttpsError('internal', 'APPROVAL_CODE is not configured')
    }
    if (code !== required) {
      return { ok: false }
    }
    try {
      await db.collection('users').doc(uid).set({ approved: true, approvedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      return { ok: true }
    } catch (e: any) {
      console.error(e)
      throw new HttpsError('internal', e.message || String(e))
    }
  }
)

// Callable: Delete own account and data
export const deleteSelf = onCall<unknown, Promise<{ ok: boolean }>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'User is not authenticated')

    // delete user doc
    await db.collection('users').doc(uid).delete().catch(() => {})

    // delete auth user
    await admin.auth().deleteUser(uid)

    return { ok: true }
  }
)
