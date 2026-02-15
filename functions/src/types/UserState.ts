export const UserStates = [
  "IDLE",
  "ASK_TITLE",
  "ASK_ARTIST",
  "ASK_AUDIO_URL",
  "ASK_SCORE_URL",
  "ASK_REFERENCE_URL_1",
  "ASK_REFERENCE_URL_2",
  "ASK_REFERENCE_URL_3",
  "ASK_REFERENCE_URL_4",
  "ASK_REFERENCE_URL_5",
  "ASK_PARTS",
  "ASK_MY_PARTS",
  "ASK_DESCRIPTION",
  "CONFIRM",
] as const;

export type UserState = (typeof UserStates)[number];
