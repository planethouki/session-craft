import { callGetMyEntries } from "../firebase";
import type { Entry } from "../models/entry";
import { timestampToDate } from "../utils/dateUtils";

export const getMyEntriesKey = (sessionId: string | undefined) =>
  (sessionId) ? ["getEntries", sessionId] : null;

export const getMyEntriesFetcher = async ([, sessionId]: [string, string,]): Promise<Entry[]> => {
  const res = await callGetMyEntries({ sessionId });

  const entries: Entry[] = res.data.entries.map((entry) => {
    return {
      ...entry,
      createdAt: timestampToDate(entry.createdAt),
      updatedAt: timestampToDate(entry.updatedAt),
    }
  });

  console.log(res.data.entries, entries)

  return entries;
};
