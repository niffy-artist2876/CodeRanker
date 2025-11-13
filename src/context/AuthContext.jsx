import { createContext, useContext, useEffect, useState } from 'react'
import api, { setToken } from '../api.js'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTok] = useState(localStorage.getItem('token'))

  useEffect(() => {
    setToken(token)
    if (token) {
      localStorage.setItem('token', token)
      api.get('/api/users/me').then(r => setUser(r.data.user)).catch(() => { setUser(null); setTok(null); localStorage.removeItem('token') })
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  const login = async (username, password) => {
    const r = await api.post('/api/auth/login', { username, password })
    setTok(r.data.token)
    setUser(r.data.user)
  }

  const logout = () => { setTok(null); setUser(null) }

  return <Ctx.Provider value={{ user, token, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
