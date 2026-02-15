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

  async replyText(replyToken: string, text: string) {
    if (!this.client) {
      throw new Error("MessageService is not initialized. Call messageService.init() first.");
    }

    return this.client.replyMessage({
      replyToken,
      messages: [{ type: "text", text }],
    });
  }

  async replyFlexMessage(replyToken: string, message: messagingApi.FlexMessage) {
    if (!this.client) {
      throw new Error("MessageService is not initialized. Call messageService.init() first.");
    }

    return this.client.replyMessage({
      replyToken,
      messages: [message],
    });
  }
}

function replyText(replyToken: string, text: string) {
  return messageService.replyText(replyToken, text);
}

function replyFlexMessage(replyToken: string, message: FlexMessage) {
  // @ts-ignore messagingApi.FlexMessage と FlexMessage は違うみたい
  return messageService.replyFlexMessage(replyToken, message);
}

export const messageService = new MessageService();
export type { MessageService };
export { replyText, replyFlexMessage };
