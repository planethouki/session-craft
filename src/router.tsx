import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { useAuth, AuthProvider } from './auth'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import Home from './screens/Home'
// import SessionList from './screens/SessionList'
// import SessionDetail from './screens/SessionDetail'
// import Settings from './screens/Settings'
import ApprovalPending from './components/ApprovalPending.tsx'
// import DeleteAccount from './screens/DeleteAccount'
// import AdminDashboard from './screens/admin/AdminDashboard'
// import MemberList from './screens/admin/MemberList'
// import MemberDetail from './screens/admin/MemberDetail'

function Guard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth()
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!firebaseUser) return <LoginScreen debug="Guard" />
  return <>{children}</>
}

function ApprovalGuard({ children }: { children: React.ReactNode }) {
  const { firestoreUser } = useAuth()
  if (!firestoreUser) return <LoginScreen debug="ApprovalGuard" />
  if (!firestoreUser.approved) return <ApprovalPending />
  return <>{children}</>
}

function LoginScreen({ debug }: { debug?: string}) {
  const { loginWithLiff, error, liffReady } = useAuth()
  return (
    <div style={{ padding: 24 }}>
      <h2>Session Craft</h2>
      {debug && <p>debug: {debug}</p>}
      <p>LINEでログインしてください。</p>
      <button onClick={loginWithLiff} disabled={!liffReady}>
        {liffReady ? 'LINEでログイン' : '初期化中...'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

const theme = createTheme()

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: (
        <Guard>
          <ApprovalGuard>
            <AppLayout>
              <Home />
            </AppLayout>
          </ApprovalGuard>
        </Guard>
      ),
    },
    // {
    //   path: '/sessions',
    //   element: (
    //     <Guard>
    //       <ApprovalGuard>
    //         <AppLayout>
    //           <SessionList />
    //         </AppLayout>
    //       </ApprovalGuard>
    //     </Guard>
    //   ),
    // },
    // {
    //   path: '/sessions/:id',
    //   element: (
    //     <Guard>
    //       <ApprovalGuard>
    //         <AppLayout>
    //           <SessionDetail />
    //         </AppLayout>
    //       </ApprovalGuard>
    //     </Guard>
    //   ),
    // },
    // {
    //   path: '/settings',
    //   element: (
    //     <Guard>
    //       <AppLayout>
    //         <Settings />
    //       </AppLayout>
    //     </Guard>
    //   ),
    // },
    // {
    //   path: '/delete',
    //   element: (
    //     <Guard>
    //       <AppLayout>
    //         <DeleteAccount />
    //       </AppLayout>
    //     </Guard>
    //   ),
    // },
    // // Admin
    // {
    //   path: '/admin',
    //   element: (
    //     <Guard>
    //       <ApprovalGuard>
    //         <AppLayout>
    //           <AdminDashboard />
    //         </AppLayout>
    //       </ApprovalGuard>
    //     </Guard>
    //   ),
    // },
    // {
    //   path: '/admin/members',
    //   element: (
    //     <Guard>
    //       <ApprovalGuard>
    //         <AppLayout>
    //           <MemberList />
    //         </AppLayout>
    //       </ApprovalGuard>
    //     </Guard>
    //   ),
    // },
    // {
    //   path: '/admin/members/:uid',
    //   element: (
    //     <Guard>
    //       <ApprovalGuard>
    //         <AppLayout>
    //           <MemberDetail />
    //         </AppLayout>
    //       </ApprovalGuard>
    //     </Guard>
    //   ),
    // },
  ])

  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
