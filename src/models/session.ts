export type sessionStatus = 'draft' | 'collectingSongs' | 'collectingEntries' | 'selecting' | 'published' | 'finalized'

export type Session = {
  id?: string
  title: string
  date: string // ISO date (YYYY-MM-DD)
  status: sessionStatus
  createdAt: Date
  updatedAt: Date
}

export type SessionRequest = {
  docId: string
  title: string
  date: string
  status: sessionStatus
  createdAt: number
  updatedAt: number
}
