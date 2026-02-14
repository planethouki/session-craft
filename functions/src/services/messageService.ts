import { messagingApi } from "@line/bot-sdk";

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
}

export const messageService = new MessageService();
export type { MessageService };
