import { setGlobalOptions } from 'firebase-functions'
import { onInit } from 'firebase-functions/v2/core'
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/https";
import * as admin from 'firebase-admin'
import * as logger from "firebase-functions/logger";
import { WebhookRequestBody } from "@line/bot-sdk";

import { handleEvent } from './services/botService'
import { messageService } from "./services/messageService";

setGlobalOptions({
  maxInstances: 10,
  region: 'asia-northeast1',
})

onInit(() => {
  admin.initializeApp()
})

const GOOGLE_GENAI_API_KEY = defineSecret('GOOGLE_GENAI_API_KEY')
const LINE_CHANNEL_ACCESS_TOKEN = defineSecret('LINE_CHANNEL_ACCESS_TOKEN')

export const lineWebhook = onRequest({
  secrets: [GOOGLE_GENAI_API_KEY, LINE_CHANNEL_ACCESS_TOKEN],
}, async (req, res) => {
  logger.info('LINE Webhook received', {body: req.body})

  const body = req.body as WebhookRequestBody;

  if (!body.events) {
    res.status(200).send('OK');
    return;
  }

  messageService.init(LINE_CHANNEL_ACCESS_TOKEN.value());

  await Promise.all(
    body.events.map((ev) => handleEvent(ev))
  );

  res.status(200).send('OK')
})

export * from './services/botService'
