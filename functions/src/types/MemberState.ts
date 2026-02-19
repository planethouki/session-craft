export const MemberStates =[
  "BANNED",
  "PENDING",
  "MEMBER",
] as const;

export type MemberState = (typeof MemberStates)[number];
