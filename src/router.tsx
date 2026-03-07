import { createBrowserRouter, RouterProvider } from 'react-router'
import Home from './pages/Home'
import Submissions from './pages/Submissions'
import Layout from "./components/Layout";
import LayoutForSubmissions from "./components/LayoutForSubmissions";
import LayoutForAdmin from "./components/LayoutForAdmin";
import Login from "./pages/Login";
import AdminHome from "./pages/admin/Home";
import SessionSettings from "./pages/admin/settings/Session";
import UserList from "./pages/admin/users/UserList";
import AccessDenied from "./pages/AccessDenied.tsx";
import { AuthProvider, AuthGuard } from "./components/AuthGuard";

function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: '/submissions',
      Component: LayoutForSubmissions,
      children: [
        {
          index: true,
          Component: Submissions,
        }
      ]
    },
    {
      path: '/admin',
      element: (
        <AuthGuard>
          <LayoutForAdmin />
        </AuthGuard>
      ),
      children: [
        {
          path: 'home',
          Component: AdminHome,
        },
        {
          path: 'settings/session',
          Component: SessionSettings,
        },
        {
          path: 'users',
          Component: UserList,
        },
      ],
    },
    {
      path: '/',
      Component: Layout,
      children: [
        {
          index: true,
          Component: Home,
        },
        {
          path: 'login',
          Component: Login,
        },
        {
          path: 'access-denied',
          Component: AccessDenied,
        },
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
