import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cmva_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const usedToken = err.config?.headers?.Authorization?.replace('Bearer ', '')
      const currentToken = localStorage.getItem('cmva_token')
      // Solo cierra sesión si el token que falló es el actual (no uno viejo en vuelo)
      if (!currentToken || !usedToken || usedToken === currentToken) {
        localStorage.removeItem('cmva_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
