import { useEffect, useState } from 'react'
import { fetchSession, loginCandidate, logoutCandidate } from '../services/api'
import { AuthContext } from './authContextObject'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      try {
        const payload = await fetchSession()

        if (isMounted) {
          setUser(payload.user)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  async function login(credentials) {
    const payload = await loginCandidate(credentials)
    setUser(payload.user)
    return payload.user
  }

  async function logout() {
    await logoutCandidate()
    setUser(null)
  }

  const value = {
    isAuthenticated: Boolean(user),
    isAuthLoading,
    login,
    logout,
    user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
