import { setGlobalOptions } from 'firebase-functions'
import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'

setGlobalOptions({
  maxInstances: 10,
  region: 'asia-northeast1',
})

admin.initializeApp()

export const lineWebhook = onRequest((req, res) => {
  logger.info('LINE Webhook received', { body: req.body })

  // LINEからの検証用リクエストなどに対応するため、200 OKを返す
  res.status(200).send('OK')
})
