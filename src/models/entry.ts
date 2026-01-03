import type { InstrumentalPart } from "./instrumentalPart";

export type Entry = {
  docId: string
  sessionId: string
  songId: string
  memberUid: string
  part: InstrumentalPart
  createdAt: Date
  updatedAt: Date
}

export type CreateEntryRequest = {
  sessionId: string
  entries: {
    songId: string
    part: InstrumentalPart
  }[]
}

export type EntryResponse = {
  docId: string
  sessionId: string
  songId: string
  memberUid: string
  part: InstrumentalPart
  createdAt: number
  updatedAt: number
}

export type GetMyEntriesResponse = {
  entries: Array<EntryResponse>
}

export type GetEntriesResponse = {
  entries: Array<EntryResponse>
}
