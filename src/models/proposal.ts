import type { InstrumentalPart } from "./instrumentalPart";

export type Proposal = {
  docId: string
  sessionId: string
  proposerUid: string
  title: string
  artist: string
  instrumentation: string
  myPart: InstrumentalPart
  sourceUrl: string
  scoreUrl: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

export type CreateProposalRequest = {
  sessionId: string
  title: string
  artist: string
  instrumentation: string
  myPart: InstrumentalPart
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
  myPart: InstrumentalPart
  sourceUrl: string
  scoreUrl: string
  notes: string
}

export type ProposalResponse = {
  docId: string
  sessionId: string
  proposerUid: string
  title: string
  artist: string
  instrumentation: string
  myPart: InstrumentalPart
  sourceUrl: string
  scoreUrl: string
  notes: string
  createdAt: number
  updatedAt: number
}

export type GetProposalsResponse = {
  proposals: Array<ProposalResponse>
}
