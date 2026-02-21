import { googleAI } from '@genkit-ai/google-genai';
import { genkit, type Genkit } from 'genkit';

class GenkitService {
  private client: Genkit | null = null;
  private googleGenAiApiKey: string | null = null;

  init(googleGenAiApiKey: string) {
    if (!googleGenAiApiKey) {
      throw new Error("GenkitService.init: googleGenAiApiKey is required");
    }

    // 同じトークンで初期化済みなら何もしない（冪等）
    if (this.client && this.googleGenAiApiKey === googleGenAiApiKey) return;

    this.googleGenAiApiKey = googleGenAiApiKey;
    this.client = genkit({
      plugins: [googleAI({ apiKey: googleGenAiApiKey })],
    });
  }

  getClient() {
    if (!this.client) {
      throw new Error("GenkitService is not initialized. Call genkitService.init() first.");
    }

    return this.client;
  }
}

export const genkitService = new GenkitService();
export type { GenkitService };
