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

export type CreateProposalRequest = {
  sessionId: string
  title: string
  artist: string
  instrumentation: string
  myInstrument: InstrumentalPart
  sourceUrl: string
  scoreUrl: string
  notes: string
}

export type UpdateProposalRequest = {
  sessionId: string
  proposalId: string
  title: string
  artist: string
  instrumentation: string
  myInstrument: InstrumentalPart
  sourceUrl: string
  scoreUrl: string
  notes: string
}
