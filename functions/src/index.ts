import { setGlobalOptions } from 'firebase-functions'
import { defineString } from 'firebase-functions/params'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import * as admin from 'firebase-admin'

setGlobalOptions({
  maxInstances: 10,
  region: 'asia-northeast1',
})

const channelId = defineString('LINE_CHANNEL_ID')

admin.initializeApp()
const db = admin.firestore()

// Callable: Verify LIFF ID token with LINE and return Firebase custom token
export const liffAuth = onCall<{ idToken: string }, Promise<{ customToken: string }>>(
  { cors: true },
  async (request) => {
    const idToken = request.data?.idToken
    if (!idToken) {
      throw new HttpsError('invalid-argument', 'idToken is required')
    }

    // Verify LIFF ID Token with LINE endpoint
    // https://developers.line.biz/en/docs/liff/using-user-profile/#verify-id-token
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: idToken, client_id: channelId.value() }),
    })

    if (!verifyRes.ok) {
      const text = await verifyRes.text()
      logger.error('LINE verify failed', { status: verifyRes.status, text })
      throw new HttpsError('invalid-argument', 'Invalid LIFF token')
    }

    const payload = (await verifyRes.json()) as {
      sub: string
      name?: string
      picture?: string
    }

    const uid = payload.sub

    // Ensure Firebase Auth user exists
    try {
      await admin.auth().getUser(uid)
    } catch {
      await admin.auth().createUser({ uid })
    }

    // Create/update user doc with default role and approval false if new
    const now = admin.firestore.FieldValue.serverTimestamp()
    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    if (userSnap.exists) {
      const userData = {
        displayName: payload.name || null,
        photoURL: payload.picture || null,
        updatedAt: now,
      }
      await userRef.set(userData, { merge: true })
    } else {
      const userData = {
        displayName: payload.name || null,
        photoURL: payload.picture || null,
        approved: false,
        roles: admin.firestore.FieldValue.arrayUnion('member'),
        createdAt: now,
        updatedAt: now,
      }
      await userRef.set(userData, { merge: true })
    }

    const customToken = await admin.auth().createCustomToken(uid)
    return { customToken }
  }
)

export * from './admin';
export * from './user';
export * from './session';
