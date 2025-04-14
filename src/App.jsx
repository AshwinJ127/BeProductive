import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './utils/supabaseClient'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Login from './pages/Login'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    // Set dark mode class on document
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {session && <NavBar session={session} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route 
            path="/" 
            element={session ? <Home session={session} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/login" 
            element={!session ? <Login /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </div>
  )
}

export default App