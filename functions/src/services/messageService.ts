import { messagingApi, FlexMessage } from "@line/bot-sdk";

class MessageService {
  private client: messagingApi.MessagingApiClient | null = null;
  private channelAccessToken: string | null = null;

  init(channelAccessToken: string) {
    if (!channelAccessToken) {
      throw new Error("MessageService.init: channelAccessToken is required");
    }

    // 同じトークンで初期化済みなら何もしない（冪等）
    if (this.client && this.channelAccessToken === channelAccessToken) return;

    this.channelAccessToken = channelAccessToken;
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken,
    });
  }

  async replyMessage(replyToken: string, messages: messagingApi.Message[]) {
    if (!this.client) {
      throw new Error("MessageService is not initialized. Call messageService.init() first.");
    }

    return this.client.replyMessage({
      replyToken,
      messages,
    });
  }
}

function replyText(replyToken: string, text: string) {
  return messageService.replyMessage(replyToken, [{ type: "text", text }]);
}

function replyFlexMessage(replyToken: string, message: FlexMessage, beforeText?: string) {
  const messages: messagingApi.Message[] = []
  if (beforeText) {
    messages.push({ type: "text", text: beforeText })
  }
  // @ts-ignore messagingApi.FlexMessage と FlexMessage は違うみたい
  messages.push(message)
  return messageService.replyMessage(replyToken, messages);
}

export const messageService = new MessageService();
export type { MessageService };
export { replyText, replyFlexMessage };
