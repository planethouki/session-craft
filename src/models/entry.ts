import type { InstrumentalPart } from "./instrumentalPart";

export type Entry = {
  id?: string
  sessionId: string
  songId: string
  memberUid: string
  part: InstrumentalPart
  createdAt: any
}

export type CreateEntryRequest = {
  sessionId: string
  entries: {
    songId: string
    part: InstrumentalPart
  }[]
}
