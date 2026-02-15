import { InstrumentalPart } from "./InstrumentalPart";

export type Entry = {
  sessionId: string;
  submissionUserId: string; // 曲を提出したユーザーID
  userId: string;           // エントリーしたユーザーID
  parts: InstrumentalPart[]; // エントリーしたパートのリスト
  createdAt: Date;
  updatedAt: Date;
};
