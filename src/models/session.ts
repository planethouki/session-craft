export type SessionStatus = 'draft' | 'collectingSongs' | 'collectingEntries' | 'selecting' | 'published' | 'finalized'

export type Session = {
  id?: string
  title: string
  date: string // ISO date (YYYY-MM-DD)
  status: SessionStatus
  createdAt: Date
  updatedAt: Date
}

export type SessionRequest = {
  docId: string
  title: string
  date: string
  status: SessionStatus
  createdAt: number
  updatedAt: number
}
