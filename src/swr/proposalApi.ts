import { callGetProposals } from "../firebase.ts";
import type { Proposal } from "../models/proposal.ts";
import {timestampToDate} from "../utils/dateUtils.ts";

export const getProposalsKey = (sessionId: string | undefined) => sessionId ? ["getProposals", sessionId] : null;

export const getProposalsFetcher = async ([, sessionId]: [string, string]): Promise<Proposal[]> => {
  const res = await callGetProposals({ sessionId });
  const proposals: Proposal[] = res.data.proposals.map((proposal) => {
    return {
      ...proposal,
      createdAt: timestampToDate(proposal.createdAt),
      updatedAt: timestampToDate(proposal.updatedAt),
    }
  });

  console.log(res.data.proposals, proposals)

  return proposals;
};
