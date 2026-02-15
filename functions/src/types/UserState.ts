export const UserStates = [
  "IDLE",
  "ASK_TITLE",
  "ASK_ARTIST",
  "ASK_URL",
  "ASK_PARTS",
  "ASK_MY_PARTS",
  "CONFIRM",
] as const;

export type UserState = (typeof UserStates)[number];
