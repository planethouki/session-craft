export const SessionStatus = {
  DRAFT: 'draft',
  COLLECTING_SONGS: 'collectingSongs',
  COLLECTING_ENTRIES: 'collectingEntries',
  SELECTING: 'selecting',
  ADJUSTING_ENTRIES: 'adjustingEntries',
  PUBLISHED: 'published',
} as const

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus]

export type InstrumentalPart = 'vo' | 'gt' | 'ba' | 'dr' | 'kb' | 'oth'
