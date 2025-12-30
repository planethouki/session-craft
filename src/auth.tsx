import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithCustomToken, signOut, type User } from 'firebase/auth'
import { auth, callLiffAuth } from './firebase'
import { type FirestoreUser } from "./models/user.ts";
import { getUserKey, getUserFetcher } from "./swr/userApi.ts";
import liff from '@line/liff'
import useSWR from "swr";

type AuthContextType = {
  firebaseUser: User | null
  firestoreUser: FirestoreUser | null
  loading: boolean
  error: string | null
  loginWithLiff: () => Promise<void>
  logout: () => Promise<void>
  liffReady: boolean
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  firestoreUser: null,
  loading: true,
  error: null,
  loginWithLiff: async () => {},
  logout: async () => {},
  liffReady: false,
})

export const useAuth = () => useContext(AuthContext)

let liffInitialized = false

async function initLiffOnce() {
  if (liffInitialized) return
  const liffId = import.meta.env.VITE_LIFF_ID as string
  if (!liffId) throw new Error('VITE_LIFF_ID is not set')
  await liff.init({ liffId })
  console.log('LIFF initialized', liff.getOS(), liff.getVersion())
  liffInitialized = true
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liffReady, setLiffReady] = useState(false)

  const { data: firestoreUser } = useSWR(
    firebaseUser ? [getUserKey, firebaseUser.uid] : null,
    getUserFetcher
  );

  useEffect(() => {
    // アプリ起動時にLIFFを初期化しておく（ボタン押下時に初期化ロジックが散らばらない）
    ;(async () => {
      try {
        await initLiffOnce()
        setLiffReady(true)
        if (liff.isLoggedIn()) {
          const idToken = liff.getIDToken()
          if (!idToken) throw new Error('Failed to get LIFF ID token')
          const resp = await callLiffAuth({ idToken })
          const customToken = (resp.data as any).customToken as string
          await signInWithCustomToken(auth, customToken)
        }
      } catch (e: any) {
        setError(e?.message || String(e))
        setLiffReady(false)
      }
    })()
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setFirebaseUser(null)
        setLoading(false)
        return
      }
      setFirebaseUser(u);
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const loginWithLiff = async () => {
    setError(null)
    try {
      if (!liffReady) throw new Error('LIFF is not ready yet. Please wait a moment.')

      if (!liff.isLoggedIn()) {
        await liff.login()
        return // page will reload and auth state effect will continue
      }
      const idToken = liff.getIDToken()
      if (!idToken) throw new Error('Failed to get LIFF ID token')
      const resp = await callLiffAuth({ idToken })
      const customToken = (resp.data as any).customToken as string
      await signInWithCustomToken(auth, customToken)
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  const logout = async () => {
    await signOut(auth)
    try {
      if (liffReady && liff.isLoggedIn()) liff.logout()
    } catch {
      // ignore
    }
  }

  const value = useMemo(
    () => {
      return {
        firebaseUser,
        firestoreUser: firestoreUser ?? null,
        loading,
        error,
        loginWithLiff,
        logout,
        liffReady
      }
    },
    [firebaseUser, firestoreUser, loading, error, liffReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
