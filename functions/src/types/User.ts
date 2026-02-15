import { UserState } from "./UserState";

import { InstrumentalPart } from "./InstrumentalPart";

export type User = {
  state: UserState;
  submissionDraft?: {
    title?: string;
    artist?: string;
    audioUrl?: string;
    scoreUrl?: string;
    referenceUrl1?: string;
    referenceUrl2?: string;
    referenceUrl3?: string;
    referenceUrl4?: string;
    referenceUrl5?: string;
    description?: string;
    parts?: InstrumentalPart[];
    myParts?: InstrumentalPart[];
  };
  entryDraft?: {
    submissionUserId?: string;
    songTitle?: string;
    parts?: InstrumentalPart[];
  };
  stateUpdatedAt: Date;
  displayName: string;
  photoURL: string;
  profileUpdatedAt: Date;
  nickname: string;
}
