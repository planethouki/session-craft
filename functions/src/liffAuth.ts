import { defineString } from 'firebase-functions/params'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import * as admin from 'firebase-admin'

const channelId = defineString('LIFF_CHANNEL_ID')

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

    const customToken = await admin.auth().createCustomToken(uid)
    return { customToken }
  }
)
