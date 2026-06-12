import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cmva_token')
    if (token) {
      api.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('cmva_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(usuario, password) {
    const r = await api.post('/auth/login', { usuario, password })
    localStorage.setItem('cmva_token', r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('cmva_token')
    setUser(null)
  }

  const isAdmin    = user?.rol === 'ADMINISTRADOR'
  const isTec      = user?.rol === 'TECNOLOGO'
  const isRad      = user?.rol === 'RADIOLOGO'
  const isConsulta = user?.rol === 'CONSULTA/GERENCIA'
  const canCreate  = isAdmin || isTec
  const canLectura = isAdmin || isRad
  const canDash    = isAdmin || isConsulta

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isTec, isRad, canCreate, canLectura, canDash }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
