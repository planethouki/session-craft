import { createBrowserRouter, RouterProvider, Outlet } from 'react-router'
import Home from './pages/Home'
import Submissions from './pages/Submissions'
import Layout from "./components/Layout";
import Login from "./pages/Login";
import AuthHome from "./pages/auth/Home";
import SessionSettings from "./pages/auth/settings/Session";
import UserList from "./pages/auth/users/UserList";
import { AuthProvider, AuthGuard } from "./components/AuthGuard";

function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: '/',
      Component: Layout,
      children: [
        {
          index: true,
          Component: Home,
        },
        {
          path: 'submissions',
          Component: Submissions,
        },
        {
          path: 'login',
          Component: Login,
        },
        {
          path: 'auth',
          element: (
            <AuthGuard>
              <Outlet />
            </AuthGuard>
          ),
          children: [
            {
              path: 'home',
              Component: AuthHome,
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
