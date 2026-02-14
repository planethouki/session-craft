export const UserStates = [
  "IDLE",
  "ASK_TITLE",
  "ASK_ARTIST",
  "ASK_URL",
  "CONFIRM",
] as const;

export type UserState = (typeof UserStates)[number];
