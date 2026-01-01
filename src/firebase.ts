import {initializeApp} from 'firebase/app'
import {getAuth} from 'firebase/auth'
import {getFirestore} from 'firebase/firestore'
import {getFunctions, httpsCallable} from 'firebase/functions'
import { type UserRequest } from "./models/user";
import { type SessionRequest } from "./models/session";
import type { CreateProposalRequest, UpdateProposalRequest } from "./models/proposal.ts";
import type { CreateEntryRequest } from "./models/entry";
import type { InstrumentalPart } from "./models/instrumentalPart.ts";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY as string,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_APP_ID as string,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'asia-northeast1')

export const callLiffAuth = httpsCallable<{ idToken: string }, {
  customToken: string
}>(functions, 'liffAuth')

export const callApproveWithCode = httpsCallable<{ code: string }, {
  ok: boolean
}>(functions, 'approveWithCode')

export const callDeleteSelf = httpsCallable<unknown, {
  ok: boolean
}>(functions, 'deleteSelf')

export const getUser = httpsCallable<unknown, UserRequest>(functions, 'getUser');

export const getSession = httpsCallable<{ sessionId: string }, SessionRequest>(functions, 'getSession');

export const adminCreateSession = httpsCallable<{ title: string, date: string }, unknown>(functions, 'adminCreateSession');

export const callCreateProposal = httpsCallable<CreateProposalRequest, { id: string }>(functions, 'createProposal');

export const callDeleteProposal = httpsCallable<{
  sessionId: string
  proposalId: string
}, { ok: boolean }>(functions, 'deleteProposal');

export const callUpdateProposal = httpsCallable<UpdateProposalRequest, { ok: boolean }>(functions, 'updateProposal');

export const callCreateEntries = httpsCallable<CreateEntryRequest, { ok: boolean }>(functions, 'createEntries');

export const callGetEntries = httpsCallable<{ sessionId: string }, {
  entries: {
    songId: string
    part: InstrumentalPart
  }[]
}>(functions, 'getEntries');
