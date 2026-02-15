import { setGlobalOptions } from 'firebase-functions'
import { onInit } from 'firebase-functions/v2/core'
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/https";
import * as admin from 'firebase-admin'
import * as logger from "firebase-functions/logger";
import { WebhookRequestBody } from "@line/bot-sdk";

import { handleEvent } from './services/botService'
import { messageService } from "./services/messageService";
import { getCurrentSession } from "./services/firestoreService";
import { updateSpreadsheetSubmissions } from "./services/spreadsheetService";

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

export const updateSpreadsheet = onRequest(async (req, res) => {
  logger.info('Update spreadsheet request received');

  try {
    const session = await getCurrentSession();
    if (!session) {
      res.status(404).send('Active session not found');
      return;
    }

    if (!session.spreadsheetIds || session.spreadsheetIds.length === 0) {
      res.status(400).send('Spreadsheet IDs not set for the current session');
      return;
    }

    await updateSpreadsheetSubmissions(session.sessionId, session.spreadsheetIds);

    logger.info('Spreadsheet update successful', { sessionId: session.sessionId });
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error updating spreadsheet', error);
    res.status(500).send('Internal Server Error');
  }
})

export * from './services/botService'
