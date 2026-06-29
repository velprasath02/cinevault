import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider} from 'react-router-dom'
import Movies from './Movies.jsx'
import Login from './Auth.jsx'
import Movie from './Movie.jsx'
import Watchlist from "./Watchlist"
import Profile from "./Profile"


const router= createBrowserRouter([
  {
    path:"/",
    element: <Movies />
  },
  {
    path:"/login",
    element: <Login />
  },
  {
    path:"/movie/:id",
    element: <Movie />
  },
  {
    path: "/watchlist",
    element: <Watchlist />
  },
  {
    path: "/profile",
    element: <Profile />
  }
])
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
