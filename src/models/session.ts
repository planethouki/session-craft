import type { Entry, EntryResponse } from "./entry";
import type { Proposal, ProposalResponse } from "./proposal";

export const SessionStatus = {
  DRAFT: 'draft',
  COLLECTING_SONGS: 'collectingSongs',
  COLLECTING_ENTRIES: 'collectingEntries',
  SELECTING: 'selecting',
  ADJUSTING_ENTRIES: 'adjustingEntries',
  PUBLISHED: 'published',
} as const

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus]

export type Session = {
  id: string
  title: string
  date: string // ISO date (YYYY-MM-DD)
  status: SessionStatus
  selectedProposals?: string[]
  createdAt: Date
  updatedAt: Date
}

export type AdminSession = Session & {
  entries: Entry[]
  proposals: Proposal[]
}

export type SessionResponse = {
  docId: string
  title: string
  date: string
  status: SessionStatus
  selectedProposals?: string[]
  createdAt: number
  updatedAt: number
}

export type AdminSessionResponse = SessionResponse & {
  entries: EntryResponse[]
  proposals: ProposalResponse[]
}

