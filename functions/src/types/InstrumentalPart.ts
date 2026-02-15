export const InstrumentalParts =[
  "Vo",
  "Cho",
  "Gt",
  "Gt2",
  "Ba",
  "Dr",
  "Key",
  "Other",
] as const;

export type InstrumentalPart = (typeof InstrumentalParts)[number];

export const DefaultInstrumentalParts: InstrumentalPart[] = [
  "Vo",
  "Gt",
  "Ba",
  "Dr",
];
