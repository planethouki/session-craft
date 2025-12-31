import { Timestamp } from 'firebase/firestore';

export type TimestampJSON = {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
};

export function timestampToDate(timestamp: TimestampJSON | any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();

  // {seconds, nanoseconds} 形式の場合
  const seconds = timestamp.seconds ?? timestamp._seconds;
  const nanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds;

  if (typeof seconds === 'number' && typeof nanoseconds === 'number') {
    return Timestamp.fromJSON({ seconds, nanoseconds, type: 'string' }).toDate();
  }

  return new Date(timestamp);
}
