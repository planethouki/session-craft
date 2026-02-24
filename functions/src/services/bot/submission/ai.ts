import { z } from 'genkit';
import { googleAI } from "@genkit-ai/google-genai";
import * as admin from "firebase-admin";
import { genkitService } from "../../genkitService";
import { replyText } from "../../messageService";
import { getUser, getActiveSessionId, getSubmission, updateUserState, createSubmission } from "../../firestoreService";
import { InstrumentalPart, InstrumentalParts } from "../../../types/InstrumentalPart";
import { Submission } from "../../../types/Submission";

const getDocId = (userId: string) => {
  const now = Date.now();
  const max = 9_999_999_999_999;
  return `${max - now}-${userId}`;
};

export async function handleAiSubmission(userId: string, replyToken: string, text: string) {
  const db = admin.firestore();
  const ai = genkitService.getClient();

  const getSystemPrompt = async () => {
    return `あなたはユーザーの曲の提出をサポートするAIアシスタントです。
ユーザーとの対話を通じて、以下の情報を収集し、最終的に曲を提出するお手伝いをします。

【表示・文体のルール】
- この会話はLINEのBOT上で行われます。Markdown記法（見出し、太字、コードブロック、表など）は正しく表示されないため、使わないでください。
- 代わりに、プレーンテキストで読みやすく整形してください（例: 「【見出し】」「・箇条書き」「改行」）。

収集が必要な情報:
- 曲名 (title)
- アーティスト (artist)
- 音源URL (audioUrl) - 任意
- コード譜URL (scoreUrl) - 任意
- 参考動画URL (referenceUrl1〜5) - 最大5つまで、任意
- 必要楽器 (parts) - InstrumentalPartの配列。選択肢: ${InstrumentalParts.join(', ')}
- 自分の担当楽器 (myParts) - InstrumentalPartの配列
- その他伝達事項 (description) - 任意

利用可能なツールを使用して、下書きの保存、現在の状況の確認、最終的な提出を行うことができます。
ユーザーが「提出して」と言った場合や、全ての情報が揃って提出の意思が確認できた場合に submitSong ツールを呼び出してください。
ユーザーが作ったメモや対話の内容を元に、適切に情報を抽出してください。

ユーザーが会話を終了したいと言った場合や、特にこれ以上手伝えることがない場合は、finishConversation ツールを呼び出して会話モードを終了してください。
finishConversation ツールは、呼び出した時点で、会話モードを終了し、通常モードに戻るため、その前に終了するメッセージをユーザーに送信してください。
`;
  };

  const finishConversationTool = ai.defineTool(
    {
      name: 'finishConversation',
      description: 'AIとの曲提出サポートの会話を終了し、通常モードに戻ります。',
      inputSchema: z.void(),
      outputSchema: z.string(),
    },
    async () => {
      await updateUserState(userId, {
        state: "IDLE",
      });
      return "会話を終了しました。";
    }
  );

  const saveSubmissionDraftTool = ai.defineTool(
    {
      name: 'saveSubmissionDraft',
      description: 'ユーザーの曲提出の下書きを保存します。',
      inputSchema: z.object({
        draft: z.object({
          title: z.string().optional(),
          artist: z.string().optional(),
          audioUrl: z.string().optional(),
          scoreUrl: z.string().optional(),
          referenceUrl1: z.string().optional(),
          referenceUrl2: z.string().optional(),
          referenceUrl3: z.string().optional(),
          referenceUrl4: z.string().optional(),
          referenceUrl5: z.string().optional(),
          parts: z.array(z.string()).optional(),
          myParts: z.array(z.string()).optional(),
          description: z.string().optional(),
        }),
      }),
      outputSchema: z.string(),
    },
    async (input) => {
      await updateUserState(userId, {
        submissionDraft: input.draft as any,
      });
      return "下書きを保存しました。";
    }
  );

  const getSubmissionStatusTool = ai.defineTool(
    {
      name: 'getSubmissionStatus',
      description: '現在の曲提出の下書き状況や、既に提出済みかどうかを確認します。',
      inputSchema: z.void(),
      outputSchema: z.object({
        isSubmitted: z.boolean(),
        submittedSong: z.any().optional(),
        draft: z.any().optional(),
      }),
    },
    async () => {
      const sessionId = await getActiveSessionId();
      const submitted = await getSubmission(sessionId, userId);
      const user = await getUser(userId);
      return {
        isSubmitted: !!submitted,
        submittedSong: submitted,
        draft: user.submissionDraft,
      };
    }
  );

  const submitSongTool = ai.defineTool(
    {
      name: 'submitSong',
      description: '曲を正式に提出（登録）します。全ての必須情報（曲名、アーティスト、必要楽器、担当楽器）が揃っている必要があります。',
      inputSchema: z.object({
        title: z.string(),
        artist: z.string(),
        audioUrl: z.string().optional(),
        scoreUrl: z.string().optional(),
        referenceUrl1: z.string().optional(),
        referenceUrl2: z.string().optional(),
        referenceUrl3: z.string().optional(),
        referenceUrl4: z.string().optional(),
        referenceUrl5: z.string().optional(),
        parts: z.array(z.string()),
        myParts: z.array(z.string()),
        description: z.string().optional(),
      }),
      outputSchema: z.string(),
    },
    async (input) => {
      const sessionId = await getActiveSessionId();
      const submission: Submission = {
        sessionId,
        userId,
        title: input.title,
        artist: input.artist,
        audioUrl: input.audioUrl || "",
        scoreUrl: input.scoreUrl || "",
        referenceUrl1: input.referenceUrl1 || "",
        referenceUrl2: input.referenceUrl2 || "",
        referenceUrl3: input.referenceUrl3 || "",
        referenceUrl4: input.referenceUrl4 || "",
        referenceUrl5: input.referenceUrl5 || "",
        parts: input.parts as InstrumentalPart[],
        myParts: input.myParts as InstrumentalPart[],
        description: input.description || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await createSubmission(submission);
      await updateUserState(userId, {
        state: "IDLE",
        submissionDraft: {},
      });
      return "曲の提出が完了しました！";
    }
  );

  const submissionFlow = ai.defineFlow(
    {
      name: 'submissionAiFlow',
      inputSchema: z.object({ prompt: z.string(), messages: z.array(z.any()) }),
    },
    async ({ prompt, messages }) => {
      const { text } = await ai.generate({
        system: await getSystemPrompt(),
        prompt,
        messages,
        tools: [saveSubmissionDraftTool, getSubmissionStatusTool, submitSongTool, finishConversationTool],
        model: googleAI.model('gemini-2.5-flash'),
      });
      return text;
    }
  );

  const conversationsRef = db.collection('conversations');

  // ユーザーの入力を保存
  await conversationsRef.doc(getDocId(userId)).set({
    userId,
    message: { role: 'user', content: [{ text: text }] },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 履歴を取得
  const conversationQuery = await conversationsRef
    .where('userId', '==', userId)
    .orderBy('createdAt', 'asc')
    .limitToLast(20) // 直近の履歴に絞る
    .get();

  const messages = conversationQuery.docs.map(doc => doc.data().message);

  // AIの回答を生成
  const aiOutputMessage = await submissionFlow({ prompt: text, messages });

  await replyText(replyToken, aiOutputMessage);

  // AIの回答を保存
  await conversationsRef.doc(getDocId(userId)).set({
    userId,
    message: { role: 'model', content: [{ text: aiOutputMessage }] },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
