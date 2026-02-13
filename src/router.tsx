import { createBrowserRouter, RouterProvider } from 'react-router'
import Home from './pages/Home'
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
