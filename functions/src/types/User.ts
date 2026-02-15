import { UserState } from "./UserState";

import { InstrumentalPart } from "./InstrumentalPart";

export type User = {
  state: UserState;
  draft: {
    title?: string;
    artist?: string;
    url?: string;
    parts?: InstrumentalPart[];
    myParts?: InstrumentalPart[];
  }
  stateUpdatedAt: Date;
}
