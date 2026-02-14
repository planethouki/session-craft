export const SessionStates = [
  "DRAFT",
  "SUBMISSION",
  "ENTRY",
  "SELECTING",
  "ADJUSTING",
  "PUBLISHED"
] as const;

export type SessionState = (typeof SessionStates)[number];
