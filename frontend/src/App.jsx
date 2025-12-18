import { SignIn , SignedOut , SignInButton , SignOutButton , UserButton , useUser } from '@clerk/clerk-react'

import { Navigate, Route , Routes } from 'react-router'
import HomePage from './pages/HomePage'
import ProblemsPage from './pages/ProblemsPage'
import {Toaster} from 'react-hot-toast'
import Dashboard from './pages/Dashboard'

function App() {
    
  const {isSignedIn , isLoaded} = useUser ();

       if (!isLoaded) return null;

  return (
    <>
      <Routes>
        <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />
        <Route path="/dashboard" element={isSignedIn ? <Dashboard /> : <Navigate to={"/"} />} />

      <Route path="/" element ={<HomePage />} />
      <Route path="/problems" element ={isSignedIn ? <ProblemsPage /> : <Navigate to="/" />} />
      <Route path="/books" element ={<Navigate to ="/" />} />
    </Routes>

    <Toaster position="top-right" toastOptions={{duration:3000}} />
  </>

    
  )
}

export default App


// tw , daisyui  , react-hot-toast , react-router
// todos : react-query  aka tanstack query , axios