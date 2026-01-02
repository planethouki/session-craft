import type { EntryResponse } from "./entry";
import type { ProposalResponse } from "./proposal";

export type SessionStatus = 'draft' | 'collectingSongs' | 'collectingEntries' | 'selecting' | 'published' | 'finalized'

export type Session = {
  id?: string
  title: string
  date: string // ISO date (YYYY-MM-DD)
  status: SessionStatus
  createdAt: Date
  updatedAt: Date
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

