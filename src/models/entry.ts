export type Entry = {
  id?: string
  sessionId: string
  songId: string
  memberUid: string
  part: 'vo' | 'gt' | 'ba' | 'dr' | 'kb' | 'oth'
  createdAt: any
}
