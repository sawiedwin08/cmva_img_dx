import { useState, useEffect } from 'react'
import api from '../../api/client'
import Alert from '../../components/Alert'
import { useAuth } from '../../contexts/AuthContext'

export default function UsuariosList() {
  const { user: me } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles]       = useState([])
  const [msg, setMsg]           = useState({ type: '', text: '' })
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [editU, setEditU]       = useState(null)
  const [form, setForm] = useState({
    nombre_completo: '', usuario: '', password: '', rol_id: '',
    correo: '', tipo_documento: '', numero_documento: '', nuevo_password: '',
  })

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/usuarios')
      setUsuarios(r.data.usuarios)
      setRoles(r.data.roles)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function openAdd() {
    setForm({ nombre_completo: '', usuario: '', password: '', rol_id: roles[0]?.id || '', correo: '', tipo_documento: '', numero_documento: '', nuevo_password: '' })
    setEditU(null)
    setShowAdd(true)
  }

  function openEdit(u) {
    setForm({ nombre_completo: u.nombre_completo, usuario: u.usuario, password: '', rol_id: u.rol_id, correo: u.correo || '', tipo_documento: u.tipo_documento || '', numero_documento: u.numero_documento || '', nuevo_password: '' })
    setEditU(u)
    setShowAdd(false)
  }

  async function save() {
    try {
      if (editU) {
        await api.put(`/usuarios/${editU.id}`, {
          nombre_completo: form.nombre_completo,
          rol_id: parseInt(form.rol_id),
          correo: form.correo || null,
          tipo_documento: form.tipo_documento || null,
          numero_documento: form.numero_documento || null,
          nuevo_password: form.nuevo_password || null,
        })
      } else {
        await api.post('/usuarios', {
          nombre_completo: form.nombre_completo,
          usuario: form.usuario,
          password: form.password,
          rol_id: parseInt(form.rol_id),
          correo: form.correo || null,
          tipo_documento: form.tipo_documento || null,
          numero_documento: form.numero_documento || null,
        })
      }
      setMsg({ type: 'success', text: 'Guardado exitosamente' })
      setShowAdd(false); setEditU(null)
      load()
    } catch (e) {
      setMsg({ type: 'danger', text: e.response?.data?.detail ?? 'Error al guardar' })
    }
  }

  async function toggle(u) {
    if (u.id === me?.id) return
    try {
      await api.post(`/usuarios/${u.id}/toggle`)
      load()
    } catch (e) {
      setMsg({ type: 'danger', text: e.response?.data?.detail ?? 'Error' })
    }
  }

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3">
        <h4 className="mb-0 fw-bold"><i className="fa-solid fa-users me-2 text-primary" />Usuarios</h4>
        <button className="btn btn-primary btn-sm ms-auto" onClick={openAdd}>
          <i className="fa-solid fa-plus me-1" />Nuevo Usuario
        </button>
      </div>

      <Alert type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />

      {(showAdd || editU) && (
        <div className="card mb-3 border-primary">
          <div className="card-header fw-semibold">{editU ? 'Editar usuario' : 'Nuevo usuario'}</div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-4">
                <label className="form-label">Nombre Completo *</label>
                <input className="form-control form-control-sm" value={form.nombre_completo}
                  onChange={e => set('nombre_completo', e.target.value)} />
              </div>
              {!editU && (
                <div className="col-md-3">
                  <label className="form-label">Usuario (login) *</label>
                  <input className="form-control form-control-sm" value={form.usuario}
                    onChange={e => set('usuario', e.target.value)} />
                </div>
              )}
              <div className="col-md-3">
                <label className="form-label">{editU ? 'Nueva Contraseña' : 'Contraseña *'}</label>
                <input type="password" className="form-control form-control-sm"
                  value={editU ? form.nuevo_password : form.password}
                  onChange={e => set(editU ? 'nuevo_password' : 'password', e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Rol *</label>
                <select className="form-select form-select-sm" value={form.rol_id}
                  onChange={e => set('rol_id', e.target.value)}>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Correo</label>
                <input className="form-control form-control-sm" value={form.correo}
                  onChange={e => set('correo', e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Tipo Doc.</label>
                <input className="form-control form-control-sm" value={form.tipo_documento}
                  onChange={e => set('tipo_documento', e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label">N° Documento</label>
                <input className="form-control form-control-sm" value={form.numero_documento}
                  onChange={e => set('numero_documento', e.target.value)} />
              </div>
            </div>
            <div className="mt-2 d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={save}>
                <i className="fa-solid fa-floppy-disk me-1" />Guardar
              </button>
              <button className="btn btn-outline-secondary btn-sm"
                onClick={() => { setShowAdd(false); setEditU(null) }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className={!u.estado ? 'table-secondary' : ''}>
                  <td>{u.nombre_completo}</td>
                  <td><code>{u.usuario}</code></td>
                  <td><span className="badge bg-secondary">{u.rol}</span></td>
                  <td className="small">{u.correo || '—'}</td>
                  <td>
                    <span className={`badge bg-${u.estado ? 'success' : 'secondary'}`}>
                      {u.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => openEdit(u)}>
                        <i className="fa-solid fa-pen" />
                      </button>
                      {u.id !== me?.id && (
                        <button
                          className={`btn btn-sm btn-outline-${u.estado ? 'warning' : 'success'}`}
                          onClick={() => toggle(u)}
                        >
                          <i className={`fa-solid fa-${u.estado ? 'toggle-off' : 'toggle-on'}`} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
