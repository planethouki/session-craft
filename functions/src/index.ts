import * as crypto from 'crypto';
import { setGlobalOptions } from 'firebase-functions'
import { onInit } from 'firebase-functions/v2/core'
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from 'firebase-admin'
import * as logger from "firebase-functions/logger";
import { WebhookRequestBody } from "@line/bot-sdk";

import { handleEvent } from './services/botService'
import { messageService } from "./services/messageService";
import { genkitService } from "./services/genkitService";
import { getCurrentSession, getLastExecutionTime, updateLastExecutionTime } from "./services/firestoreService";
import { updateSpreadsheetSubmissions, updateSpreadsheetEntries } from "./services/spreadsheetService";

setGlobalOptions({
  maxInstances: 10,
  region: 'asia-northeast1',
})

onInit(() => {
  admin.initializeApp()
})

const GOOGLE_GENAI_API_KEY = defineSecret('GOOGLE_GENAI_API_KEY')
const LINE_CHANNEL_ACCESS_TOKEN = defineSecret('LINE_CHANNEL_ACCESS_TOKEN')
const LINE_CHANNEL_SECRET = defineSecret('LINE_CHANNEL_SECRET')
export const SUBMISSIONS_WEB_URL = defineString('SUBMISSIONS_WEB_URL')

export const lineWebhook = onRequest({
  secrets: [GOOGLE_GENAI_API_KEY, LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET],
}, async (req, res) => {
  logger.info('LINE Webhook received', {body: req.body})

  const body = req.body as WebhookRequestBody;

  if (!body.events) {
    res.status(200).send('OK');
    return;
  }

  const channelSecret = LINE_CHANNEL_SECRET.value();
  const signature = crypto
    .createHmac("SHA256", channelSecret)
    .update(req.rawBody.toString())
    .digest("base64");
  const X_LINE_SIGNATURE = req.get("X-Line-Signature");

  if (X_LINE_SIGNATURE !== signature) {
    logger.error('Invalid signature', { signature, X_LINE_SIGNATURE });
    res.status(400).send('NG');
    return;
  }

  messageService.init(LINE_CHANNEL_ACCESS_TOKEN.value());
  genkitService.init(GOOGLE_GENAI_API_KEY.value());

  await Promise.all(
    body.events.map((ev) => handleEvent(ev))
  );

  res.status(200).send('OK')
})

export const onSubmissionWritten = onDocumentWritten({
  document: "submissions/{submissionId}",
  memory: '512MiB',
  maxInstances: 1,
}, async (event) => {
  logger.info("Submission written", { params: event.params });

  const lastExecution = await getLastExecutionTime('onSubmissionWritten');
  const now = new Date();
  if (lastExecution && now.getTime() - lastExecution.getTime() < 5 * 1000) {
    logger.info("Submission update skipped due to rate limit", { lastExecution });
    return;
  }

  const session = await getCurrentSession();
  if (!session) {
    logger.warn("Active session not found");
    return;
  }

  const submissionIds = session.submissionSpreadsheetIds || [];
  if (submissionIds.length > 0) {
    await updateSpreadsheetSubmissions(session.sessionId, submissionIds);
    await updateLastExecutionTime('onSubmissionWritten');
    logger.info("Spreadsheet submissions updated", { sessionId: session.sessionId });
  }
});

export const onEntryWritten = onDocumentWritten({
  document: "entries/{entryId}",
  memory: '512MiB',
  maxInstances: 1,
}, async (event) => {
  logger.info("Entry written", { params: event.params });

  const lastExecution = await getLastExecutionTime('onEntryWritten');
  const now = new Date();
  if (lastExecution && now.getTime() - lastExecution.getTime() < 5 * 1000) {
    logger.info("Entry update skipped due to rate limit", { lastExecution });
    return;
  }

  const session = await getCurrentSession();
  if (!session) {
    logger.warn("Active session not found");
    return;
  }

  const entryIds = session.entrySpreadsheetIds || [];
  if (entryIds.length > 0) {
    await updateSpreadsheetEntries(session.sessionId, entryIds);
    await updateLastExecutionTime('onEntryWritten');
    logger.info("Spreadsheet entries updated", { sessionId: session.sessionId });
  }
});


export const updateSpreadsheet = onRequest(async (req, res) => {
  logger.info('Update spreadsheet request received');

  try {
    const session = await getCurrentSession();
    if (!session) {
      res.status(404).send('Active session not found');
      return;
    }

    const submissionIds = session.submissionSpreadsheetIds || [];
    const entryIds = session.entrySpreadsheetIds || [];

    if (submissionIds.length === 0 && entryIds.length === 0) {
      res.status(400).send('Spreadsheet IDs not set for the current session');
      return;
    }

    if (submissionIds.length > 0) {
      await updateSpreadsheetSubmissions(session.sessionId, submissionIds);
    }
    if (entryIds.length > 0) {
      await updateSpreadsheetEntries(session.sessionId, entryIds);
    }

    logger.info('Spreadsheet update successful', { sessionId: session.sessionId });
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error updating spreadsheet', error);
    res.status(500).send('Internal Server Error');
  }
})

export * from './web'
