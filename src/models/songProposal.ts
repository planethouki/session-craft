import type { InstrumentalPart } from "./instrumentalPart";

export type SongProposal = {
  id?: string
  sessionId: string
  proposerUid: string
  title: string
  artist: string
  instrumentation: string
  myInstrument: InstrumentalPart
  sourceUrl: string
  scoreUrl: string
  notes?: string
  createdAt: any
}
