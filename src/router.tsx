import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { useAuth, AuthProvider } from './auth'
import Home from './pages/Home.tsx'
import SessionDetail from './pages/SessionDetail'
import Settings from './pages/Settings'
import ApprovalPending from './components/ApprovalPending.tsx'
import DeleteAccount from './pages/DeleteAccount'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSessionList from './pages/admin/SessionList'
import MemberList from './pages/admin/MemberList'
import MemberDetail from './pages/admin/MemberDetail'
import AdminLayout from "./components/AdminLayout";
import Layout from "./components/Layout.tsx";
import Login from "./pages/Login"

function Guard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth()
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!firebaseUser) return <Login debug="Guard" />
  return <>{children}</>
}

function ApprovalGuard({ children }: { children: React.ReactNode }) {
  const { firestoreUser } = useAuth()
  if (!firestoreUser) return <Login debug="ApprovalGuard" />
  if (!firestoreUser.approved) return <ApprovalPending />
  return <>{children}</>
}

function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: '/',
      Component: Layout,
      children: [
        {
          path: '',
          element: (
            <Guard>
              <ApprovalGuard>
                <Home />
              </ApprovalGuard>
            </Guard>
          ),
        },
        {
          path: 'sessions/:id',
          element: (
            <Guard>
              <ApprovalGuard>
                <SessionDetail />
              </ApprovalGuard>
            </Guard>
          ),
        },
        {
          path: '/settings',
          element: (
            <Guard>
              <Settings />
            </Guard>
          ),
        },
        {
          path: '/delete',
          element: (
            <Guard>
              <DeleteAccount />
            </Guard>
          ),
        },
      ],
    },
    // // Admin
    {
      path: '/admin',
      Component: AdminLayout,
      children: [
        {
          path: '',
          element: (
            <Guard>
              <ApprovalGuard>
                <AdminDashboard />
              </ApprovalGuard>
            </Guard>
          ),
        },
        {
          path: 'sessions',
          element: (
            <Guard>
              <ApprovalGuard>
                <AdminSessionList />
              </ApprovalGuard>
            </Guard>
          ),
        },
        {
          path: 'members',
          element: (
            <Guard>
              <ApprovalGuard>
                <MemberList />
              </ApprovalGuard>
            </Guard>
          ),
        },
        {
          path: 'members/:uid',
          element: (
            <Guard>
              <ApprovalGuard>
                <MemberDetail />
              </ApprovalGuard>
            </Guard>
          ),
        },
      ],
    },
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
