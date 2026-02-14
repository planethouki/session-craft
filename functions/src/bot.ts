import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from "firebase-functions/params";
import * as logger from 'firebase-functions/logger'

import { googleAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

import { messagingApi, WebhookRequestBody } from '@line/bot-sdk';

const GOOGLE_GENAI_API_KEY = defineSecret('GOOGLE_GENAI_API_KEY')
const LINE_CHANNEL_ACCESS_TOKEN = defineSecret('LINE_CHANNEL_ACCESS_TOKEN')

export const lineWebhook = onRequest({
  secrets: [ GOOGLE_GENAI_API_KEY, LINE_CHANNEL_ACCESS_TOKEN ],
}, async (req, res) => {
  logger.info('LINE Webhook received', { body: req.body })

  const body = req.body as WebhookRequestBody;

  const client = new messagingApi.MessagingApiClient({
    channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN.value(),
  });

  const ai = genkit({
    plugins: [googleAI({ apiKey: GOOGLE_GENAI_API_KEY.value() })],
  });

  const helloFlow = ai.defineFlow('helloFlow', async (name) => {
    // make a generation request
    // const { text } = await ai.generate(`Hello Gemini, my name is ${name}`);
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: name,
    });

    return text;
  });

  for (const event of body.events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue;

    const text = event.message.text;
    const response = await helloFlow(text);
    const result = await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: response }],
    })
    logger.info('result', result);
  }

  // LINEからの検証用リクエストなどに対応するため、200 OKを返す
  res.status(200).send('OK')
})
