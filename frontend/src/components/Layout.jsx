import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { user, logout, isAdmin, canCreate, canLectura, canDash } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/')
      ? 'active' : ''
  }

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark cmva-navbar px-3">
        <button
          className="btn btn-sm btn-outline-light me-2 d-lg-none"
          onClick={() => setSidebarOpen(o => !o)}
        >
          <i className="fa-solid fa-bars" />
        </button>
        <Link className="navbar-brand fw-bold" to="/registros">
          <i className="fa-solid fa-x-ray me-2" />CMVA – Imágenes Diagnósticas
        </Link>
        <div className="ms-auto d-flex align-items-center gap-2">
          <span className="text-white-50 d-none d-md-inline">
            <i className="fa-solid fa-user-circle me-1" />
            <strong className="text-white">{user?.nombre_completo}</strong>
            <span className="badge bg-secondary ms-2">{user?.rol}</span>
          </span>
          <Link to="/cambiar-password" className="btn btn-outline-light btn-sm">
            <i className="fa-solid fa-key me-1" />
            <span className="d-none d-md-inline">Contraseña</span>
          </Link>
          <button onClick={handleLogout} className="btn btn-danger btn-sm">
            <i className="fa-solid fa-right-from-bracket me-1" />
            <span className="d-none d-md-inline">Salir</span>
          </button>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav
          className={`cmva-sidebar py-3 ${sidebarOpen ? '' : 'd-none'}`}
          style={{ width: 220, minWidth: 220 }}
        >
          <ul className="nav flex-column px-2">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/registros')}`} to="/registros">
                <i className="fa-solid fa-list-ul me-2" />Registros
              </Link>
            </li>

            {canCreate && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/registros/nuevo')}`} to="/registros/nuevo">
                  <i className="fa-solid fa-plus-circle me-2" />Nuevo Estudio
                </Link>
              </li>
            )}

            {canLectura && !isAdmin && (
              <li className="nav-item">
                <Link className="nav-link" to="/registros?estado=PENDIENTE">
                  <i className="fa-solid fa-clock me-2" />Pendientes de Lectura
                </Link>
              </li>
            )}

            {canDash && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                  <i className="fa-solid fa-chart-bar me-2" />Dashboard
                </Link>
              </li>
            )}

            <li className="nav-item mt-3">
              <Link className={`nav-link ${isActive('/manual')}`} to="/manual">
                <i className="fa-solid fa-book-open me-2" />Manual de Usuario
              </Link>
            </li>

            {isAdmin && (
              <>
                <li className="nav-item mt-2">
                  <small className="text-uppercase text-secondary px-3 fw-bold" style={{ fontSize: '0.7rem' }}>
                    Administración
                  </small>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/admin/usuarios')}`} to="/admin/usuarios">
                    <i className="fa-solid fa-users me-2" />Usuarios
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/catalogos')}`} to="/catalogos">
                    <i className="fa-solid fa-book me-2" />Catálogos
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/auditoria')}`} to="/auditoria">
                    <i className="fa-solid fa-shield-halved me-2" />Auditoría
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-grow-1 cmva-main py-3 px-4" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
