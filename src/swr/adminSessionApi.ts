import { adminGetSession } from "../firebase.ts";
import type { AdminSession, AdminSessionResponse } from "../models/session";
import { timestampToDate } from "../utils/dateUtils.ts";

export const getSessionKey = (sessionId: string | undefined) => sessionId ? ["adminGetSession", sessionId] : null;

export const getSessionFetcher = async ([, sessionId]: [string, string]): Promise<AdminSession> => {
  const res = await adminGetSession({sessionId});

  const sessionResponse: AdminSessionResponse = res.data;
  const session: AdminSession = {
    id: sessionId,
    title: sessionResponse.title,
    date: sessionResponse.date,
    status: sessionResponse.status,
    selectedProposals: sessionResponse.selectedProposals,
    createdAt: timestampToDate(sessionResponse.createdAt),
    updatedAt: timestampToDate(sessionResponse.updatedAt),
    entries: sessionResponse.entries.map(e => ({
      ...e,
      createdAt: timestampToDate(e.createdAt),
      updatedAt: timestampToDate(e.updatedAt),
    })),
    proposals: sessionResponse.proposals.map(e => ({
      ...e,
      createdAt: timestampToDate(e.createdAt),
      updatedAt: timestampToDate(e.updatedAt),
    })),
  };

  console.log(sessionResponse, session);

  return session;
};
