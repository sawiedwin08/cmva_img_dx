import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login          from './pages/Login'
import RegistrosList  from './pages/registros/RegistrosList'
import RegistroForm   from './pages/registros/RegistroForm'
import RegistroDetail from './pages/registros/RegistroDetail'
import LecturaForm    from './pages/registros/LecturaForm'
import Dashboard      from './pages/Dashboard'
import CatalogsIndex  from './pages/catalogs/CatalogsIndex'
import CatalogList    from './pages/catalogs/CatalogList'
import UsuariosList   from './pages/admin/UsuariosList'
import Manual         from './pages/Manual'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/registros" replace />} />

          <Route path="/registros" element={<ProtectedRoute><RegistrosList /></ProtectedRoute>} />
          <Route path="/registros/nuevo" element={<ProtectedRoute><RegistroForm /></ProtectedRoute>} />
          <Route path="/registros/:id" element={<ProtectedRoute><RegistroDetail /></ProtectedRoute>} />
          <Route path="/registros/:id/editar" element={<ProtectedRoute><RegistroForm /></ProtectedRoute>} />
          <Route path="/registros/:id/lectura" element={<ProtectedRoute><LecturaForm /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/catalogos" element={<ProtectedRoute requireAdmin><CatalogsIndex /></ProtectedRoute>} />
          <Route path="/catalogos/:catalog" element={<ProtectedRoute requireAdmin><CatalogList /></ProtectedRoute>} />

          <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><UsuariosList /></ProtectedRoute>} />

          <Route path="/manual" element={<ProtectedRoute><Manual /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/registros" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
