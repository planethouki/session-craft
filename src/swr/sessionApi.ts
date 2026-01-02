import { getSession } from "../firebase.ts";
import type { Session, SessionResponse } from "../models/session";
import { timestampToDate } from "../utils/dateUtils.ts";

export const getSessionKey = (sessionId: string | undefined) => sessionId ? ["getSession", sessionId] : null;

export const getSessionFetcher = async ([, sessionId]: [string, string]): Promise<Session> => {
  const res = await getSession({sessionId});

  const sessionRequest: SessionResponse = res.data;
  const session: Session = {
    id: sessionId,
    title: sessionRequest.title,
    date: sessionRequest.date,
    status: sessionRequest.status,
    createdAt: timestampToDate(sessionRequest.createdAt),
    updatedAt: timestampToDate(sessionRequest.updatedAt),
  };

  console.log(sessionRequest, session);

  return session;
};
