import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'
import Alert from '../../components/Alert'

const CATALOG_META = {
  estudios:       { title: 'Estudios Radiológicos', fields: ['codigo', 'nombre'], tipoOptions: ['RX', 'TAC', 'ECO'] },
  servicios:      { title: 'Servicios',             fields: ['codigo', 'nombre'] },
  profesionales:  { title: 'Profesionales',         fields: ['nombre'],          tipoOptions: ['MEDICO GENERAL', 'ESPECIALISTA'] },
  causas_rechazo: { title: 'Causas de Rechazo',     fields: ['descripcion'] },
  reportes:       { title: 'Reportes',              fields: ['nombre'] },
  especialidades: { title: 'Especialidades',        fields: ['nombre', 'descripcion'] },
}

const CATALOG_SIMPLE_KEYS = Object.keys(CATALOG_META)

// Endpoint correcto para cada catálogo
function catalogEndpoint(key) {
  return `/catalogs/${key.replace('_', '-')}`
}

export default function CatalogList() {
  const { catalog } = useParams()
  const meta = CATALOG_META[catalog] ?? { title: catalog, fields: ['nombre'] }
  const [items, setItems]   = useState([])
  const [msg, setMsg]       = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({})

  async function load() {
    setLoading(true)
    try {
      const r = await api.get(catalogEndpoint(catalog))
      setItems(r.data.items ?? [])
    } catch {
      setMsg({ type: 'danger', text: 'Error cargando datos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [catalog])

  function openAdd() { setForm({}); setShowAdd(true); setEditItem(null) }
  function openEdit(item) { setForm({ ...item }); setEditItem(item); setShowAdd(false) }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    try {
      if (editItem) {
        await api.put(`${catalogEndpoint(catalog)}/${editItem.id}`, form)
      } else {
        await api.post(catalogEndpoint(catalog), form)
      }
      setMsg({ type: 'success', text: 'Guardado exitosamente' })
      setShowAdd(false)
      setEditItem(null)
      load()
    } catch (e) {
      setMsg({ type: 'danger', text: e.response?.data?.detail ?? 'Error al guardar' })
    }
  }

  async function toggle(item) {
    try {
      await api.post(`${catalogEndpoint(catalog)}/${item.id}/toggle`)
      load()
    } catch {
      setMsg({ type: 'danger', text: 'Error al cambiar estado' })
    }
  }

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/catalogos" className="btn btn-outline-secondary btn-sm">
          <i className="fa-solid fa-arrow-left" />
        </Link>
        <h4 className="mb-0 fw-bold">{meta.title}</h4>
        <button className="btn btn-primary btn-sm ms-auto" onClick={openAdd}>
          <i className="fa-solid fa-plus me-1" />Agregar
        </button>
      </div>

      <Alert type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />

      {/* Formulario agregar / editar */}
      {(showAdd || editItem) && (
        <div className="card mb-3 border-primary">
          <div className="card-header fw-semibold">
            {editItem ? 'Editar registro' : 'Agregar nuevo'}
          </div>
          <div className="card-body">
            <div className="row g-2">
              {meta.fields.map(f => (
                <div key={f} className="col-md-4">
                  <label className="form-label text-capitalize">{f}</label>
                  <input type="text" className="form-control form-control-sm"
                    value={form[f] || ''}
                    onChange={e => setField(f, e.target.value)} />
                </div>
              ))}
              {meta.tipoOptions && (
                <div className="col-md-4">
                  <label className="form-label">Tipo</label>
                  <select className="form-select form-select-sm"
                    value={form.tipo || meta.tipoOptions[0]}
                    onChange={e => setField('tipo', e.target.value)}>
                    {meta.tipoOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-2 d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={save}>
                <i className="fa-solid fa-floppy-disk me-1" />Guardar
              </button>
              <button className="btn btn-outline-secondary btn-sm"
                onClick={() => { setShowAdd(false); setEditItem(null) }}>
                Cancelar
              </button>
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
                <th>#</th>
                {meta.fields.map(f => <th key={f} className="text-capitalize">{f}</th>)}
                {meta.tipoOptions && <th>Tipo</th>}
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-muted">Sin registros</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className={item.estado === false ? 'table-secondary' : ''}>
                  <td className="text-muted small">{item.id}</td>
                  {meta.fields.map(f => <td key={f}>{item[f] || '—'}</td>)}
                  {meta.tipoOptions && <td><span className="badge bg-secondary">{item.tipo}</span></td>}
                  <td>
                    <span className={`badge bg-${item.estado !== false ? 'success' : 'secondary'}`}>
                      {item.estado !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => openEdit(item)}>
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        className={`btn btn-sm btn-outline-${item.estado !== false ? 'warning' : 'success'}`}
                        onClick={() => toggle(item)}
                      >
                        <i className={`fa-solid fa-${item.estado !== false ? 'toggle-off' : 'toggle-on'}`} />
                      </button>
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
