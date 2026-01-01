import { createBrowserRouter, RouterProvider, Outlet } from 'react-router'
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
import ApprovalLayout from "./components/ApprovalLayout";

function Guard() {
  const { firebaseUser, loading } = useAuth()
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!firebaseUser) return <Login debug="Guard" />
  return <Outlet />
}

function ApprovalGuard() {
  const { firestoreUser } = useAuth()
  if (!firestoreUser) return <Login debug="ApprovalGuard" />
  if (!firestoreUser.approved) return <ApprovalPending />
  return <Outlet />
}

function AdminGuard() {
  const { firebaseUser, loading, firestoreUser } = useAuth()
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!firebaseUser) return <Login debug="Guard" />
  if (!firestoreUser) return <Login debug="AdminGuard" />
  if (!firestoreUser.roles?.includes('admin')) return <Login debug="AdminGuard" />
}

function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: '/',
      Component: Guard,
      children: [
        {
          Component: ApprovalGuard,
          children: [
            {
              Component: ApprovalLayout,
              children: [
                {
                  path: '',
                  Component: Home
                },
                {
                  path: 'sessions/:id',
                  Component: SessionDetail
                }
              ]
            },
          ]
        },
        {
          Component: Layout,
          children: [
            {
              path: '/settings',
              Component: Settings,
            },
            {
              path: '/delete',
              Component: DeleteAccount,
            },
          ]
        },
      ],
    },
    // // Admin
    {
      path: '/admin',
      Component: AdminGuard,
      children: [
        {
          Component: AdminLayout,
          children: [
            {
              path: '',
              Component: AdminDashboard
            },
            {
              path: 'sessions',
              Component: AdminSessionList
            },
            {
              path: 'members',
              Component: MemberList
            },
            {
              path: 'members/:uid',
              Component: MemberDetail
            }
          ]
        }
      ]
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
