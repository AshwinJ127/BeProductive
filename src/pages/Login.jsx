import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'

function Login() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    
    try {
      setLoading(true)
      
      let result
      if (isSignUp) {
        // Sign up
        result = await supabase.auth.signUp({
          email,
          password,
        })
      } else {
        // Sign in
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      }
      
      if (result.error) {
        throw result.error
      }
      
      // If we're signing up, show a message
      if (isSignUp && !result.error) {
        setError({
          message: 'Check your email for the confirmation link!',
          isSuccess: true
        })
      }
    } catch (error) {
      setError({
        message: error.message,
        isSuccess: false
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Create an Account' : 'Sign In'}
        </h1>
        
        {error && (
          <div className={`p-3 mb-4 rounded-md ${error.isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {error.message}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full mb-4"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login