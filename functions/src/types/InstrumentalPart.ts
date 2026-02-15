export const InstrumentalParts =[
  "VO",
  "CHO",
  "GT",
  "GT2",
  "BA",
  "DR",
  "KEY",
  "OTHER",
] as const;

export type InstrumentalPart = (typeof InstrumentalParts)[number];
