import { UserState } from "./UserState";

export type User = {
  state: UserState;
  draft: {
    title?: string;
    artist?: string;
    url?: string;
  }
  stateUpdatedAt: Date;
}
