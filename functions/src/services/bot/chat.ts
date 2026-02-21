import { z } from 'genkit';
import { googleAI } from "@genkit-ai/google-genai";
import * as admin from "firebase-admin";

import { genkitService } from "../genkitService";
import { replyText } from "../messageService";

const getDocId = (userId: string) => {
  const now = Date.now();
  const max = 9_999_999_999_999;
  return `${max - now}-${userId}`
};

export async function handleChat(userId: string, replyToken: string, text: string) {

  const db = admin.firestore();
  const ai = genkitService.getClient();

  const getSystemPrompt = async () => {
    const systemPrompt = await db.doc('system/systemPrompts').get();
    return systemPrompt.data()?.systemPrompt ?? "";
  }

  const helloFlow = ai.defineFlow({
    name: 'helloFlow',
    inputSchema: z.object({ prompt: z.string(), messages: z.array(z.any()) })
  }, async ({prompt, messages}) => {
    const { text } = await ai.generate({
      system: await getSystemPrompt(),
      prompt,
      messages,
      model: googleAI.model('gemini-2.5-flash'),
    });

    return text;
  });

  const conversationsRef = db.collection('conversations');

  await conversationsRef.doc(getDocId(userId)).set({
    userId,
    message: { role: 'user', content: [{ text: text }] },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const conversationQuery = await conversationsRef.get()
  const messages = conversationQuery
    .docs
    .map(doc => doc.data())
    .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
    .map(data => data.message);

  const aiOutputMessage = await helloFlow({ prompt: text, messages });

  await replyText(replyToken, aiOutputMessage);

  await conversationsRef.doc(getDocId(userId)).set({
    userId,
    message: { role: 'model', content: [{ text: aiOutputMessage }] },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
