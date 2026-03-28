import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('hn_token')
    if (!token || token === 'undefined' || token === 'null') { 
      setLoading(false)
      return 
    }
    
    api.auth.me()
      .then((data) => setUser(data.user || data))
      .catch((err) => {
        console.error("Session restore failed", err)
        localStorage.removeItem('hn_token')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async ({ username, password }) => {
    const data = await api.auth.login({ username, password })
    const token = data.accessToken || data.token
    if (token) localStorage.setItem('hn_token', token)
    
    // Fetch user details immediately after saving token
    const me = await api.auth.me()
    setUser(me.user || me)
    return me
  }, [])

  const register = useCallback(async (body) => {
    // Register the user (backend does not return token here)
    await api.auth.register(body)
    
    // Automatically log the user in using the credentials they just created
    return login({ username: body.username, password: body.password })
  }, [login])

  const logout = useCallback(async () => {
    try { await api.auth.logout() } catch {}
    localStorage.removeItem('hn_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
