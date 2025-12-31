export type Session = {
  id?: string
  title: string
  date: string // ISO date (YYYY-MM-DD)
  status: 'collectingSongs' | 'collectingEntries' | 'selecting' | 'published' | 'finalized'
  createdAt: any
  updatedAt: any
}
