import { InstrumentalPart } from "./InstrumentalPart";

export type Submission = {
  sessionId: string;
  userId: string;
  titleRaw: string;
  artistRaw: string;
  audioUrl?: string;
  scoreUrl?: string;
  referenceUrl1?: string;
  referenceUrl2?: string;
  referenceUrl3?: string;
  referenceUrl4?: string;
  referenceUrl5?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  parts: InstrumentalPart[];
  myParts: InstrumentalPart[];
}
