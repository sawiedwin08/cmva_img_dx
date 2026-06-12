import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ usuario: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.usuario, form.password)
      navigate('/registros', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a3c5e,#2a6496)' }}
    >
      <div className="card shadow-lg" style={{ width: '100%', maxWidth: 400 }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <i className="fa-solid fa-x-ray fa-3x text-primary mb-2" />
            <h4 className="fw-bold">CMVA – Imágenes Diagnósticas</h4>
            <p className="text-muted small">Ingrese sus credenciales para continuar</p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="fa-solid fa-circle-exclamation me-2" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Usuario</label>
              <div className="input-group">
                <span className="input-group-text"><i className="fa-solid fa-user" /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="nombre de usuario"
                  value={form.usuario}
                  onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text"><i className="fa-solid fa-lock" /></span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="contraseña"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Ingresando...</>
                : <><i className="fa-solid fa-right-to-bracket me-2" />Ingresar</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
