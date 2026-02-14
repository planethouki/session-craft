import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from "firebase-functions/params";
import * as logger from 'firebase-functions/logger'
import * as admin from 'firebase-admin'

import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';

import { messagingApi, WebhookRequestBody } from '@line/bot-sdk';

const GOOGLE_GENAI_API_KEY = defineSecret('GOOGLE_GENAI_API_KEY')
const LINE_CHANNEL_ACCESS_TOKEN = defineSecret('LINE_CHANNEL_ACCESS_TOKEN')

export const lineWebhook = onRequest({
  secrets: [ GOOGLE_GENAI_API_KEY, LINE_CHANNEL_ACCESS_TOKEN ],
}, async (req, res) => {
  logger.info('LINE Webhook received', { body: req.body })

  const db = admin.firestore();

  const body = req.body as WebhookRequestBody;

  const client = new messagingApi.MessagingApiClient({
    channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN.value(),
  });

  const ai = genkit({
    plugins: [googleAI({ apiKey: GOOGLE_GENAI_API_KEY.value() })],
  });

  const helloFlow = ai.defineFlow({
    name: 'helloFlow',
    inputSchema: z.object({ prompt: z.string(), messages: z.array(z.any()) })
  }, async ({prompt, messages}) => {
    const { text } = await ai.generate({
      prompt,
      messages,
      model: googleAI.model('gemini-2.5-flash'),
    });

    return text;
  });

  const conversationsRef = db.collection('conversations');

  for (const event of body.events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue;

    if (event.source.type !== 'user') continue;
    if (!event.source.userId) continue;

    const userId = event.source.userId;
    const userInputText = event.message.text;

    const conversationQuery = await conversationsRef.get()
    const messages = conversationQuery
      .docs
      .map(doc => doc.data())
      .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
      .map(data => data.message);

    logger.info('messages', messages);

    const aiOutputMessage = await helloFlow({ prompt: userInputText, messages });

    const lineResponseResult = await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: aiOutputMessage }],
    })

    logger.info('lineResponseResult', lineResponseResult);

    await conversationsRef.doc().set({
      userId,
      message: { role: 'user', content: [{ text: userInputText }] },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await conversationsRef.doc().set({
      userId,
      message: { role: 'model', content: [{ text: aiOutputMessage }] },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // LINEからの検証用リクエストなどに対応するため、200 OKを返す
  res.status(200).send('OK')
})
