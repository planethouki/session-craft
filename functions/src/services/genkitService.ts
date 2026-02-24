import { googleAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

class GenkitService {
  private googleGenAiApiKey: string | null = null;

  init(googleGenAiApiKey: string) {
    if (!googleGenAiApiKey) {
      throw new Error("GenkitService.init: googleGenAiApiKey is required");
    }

    // トークンが同じなら何もしない（冪等）
    if (this.googleGenAiApiKey === googleGenAiApiKey) return;

    this.googleGenAiApiKey = googleGenAiApiKey;
  }

  getClient() {
    if (!this.googleGenAiApiKey) {
      throw new Error("GenkitService is not initialized. Call genkitService.init() first.");
    }

    return genkit({
      plugins: [googleAI({ apiKey: this.googleGenAiApiKey })],
    });
  }
}

export const genkitService = new GenkitService();
export type { GenkitService };
