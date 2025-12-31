export type sessionStatus = 'collectingSongs' | 'collectingEntries' | 'selecting' | 'published' | 'finalized'

export type Session = {
  id?: string
  title: string
  date: string // ISO date (YYYY-MM-DD)
  status: sessionStatus
  createdAt: any
  updatedAt: any
}
