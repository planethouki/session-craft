import {initializeApp} from 'firebase/app'
import {getAuth} from 'firebase/auth'
import {getFirestore} from 'firebase/firestore'
import {getFunctions, httpsCallable} from 'firebase/functions'
import { type UserRequest } from "./models/user.ts";

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
