import type { Entry, EntryResponse } from "./entry";
import type { Proposal, ProposalResponse } from "./proposal";

export type SessionStatus = 'draft' | 'collectingSongs' | 'collectingEntries' | 'selecting' | 'published' | 'finalized'

export type Session = {
  id?: string
  title: string
  date: string // ISO date (YYYY-MM-DD)
  status: SessionStatus
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
  createdAt: number
  updatedAt: number
}

export type AdminSessionResponse = SessionResponse & {
  entries: EntryResponse[]
  proposals: ProposalResponse[]
}

