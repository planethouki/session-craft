import { HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

const db = admin.firestore()

export async function checkUserApproved(uid: string): Promise<void> {
  const userSnap = await db.collection('users').doc(uid).get()
  const userData = userSnap.data()
  if (!userData?.approved) {
    throw new HttpsError('permission-denied', 'User is not approved')
  }
}
