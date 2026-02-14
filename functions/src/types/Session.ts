import { SessionState } from "./SessionState";

export type Session = {
  sessionId: string
  title: string
  description: string
  sessionDate: Date
  sessionLocation: string
  state: SessionState
}
