import { createBrowserRouter, RouterProvider } from 'react-router'
import Home from './pages/Home'
import Submissions from './pages/Submissions'
import Layout from "./components/Layout";

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
      ]
    },
  ])

  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <AppRoutes />
  )
}
