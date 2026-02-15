import { InstrumentalPart } from "./InstrumentalPart";

export type Submission = {
  sessionId: string;
  userId: string;
  titleRaw: string;
  artistRaw: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  parts: InstrumentalPart[];
  myParts: InstrumentalPart[];
}
