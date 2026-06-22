import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'

const TIPOS = { RX: 'primary', TAC: 'info', ECO: 'success' }
const ESTADOS = { 'POR CARGAR': 'warning', PENDIENTE: 'primary', LEIDO: 'success', CORREGIDO: 'info', ANULADO: 'secondary' }
const ESTADOS_CARGA = { 'POR CARGAR': 'warning', 'CARGADO': 'success' }

const TABS_ESTADO = [
  { val: '',           label: 'Todos' },
  { val: 'POR CARGAR', label: 'Por Cargar' },
  { val: 'PENDIENTE',  label: 'Pendiente' },
  { val: 'LEIDO',      label: 'Leído' },
  { val: 'CORREGIDO',  label: 'Corregido' },
  { val: 'ANULADO',    label: 'Anulado' },
]

function fdt(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function RegistrosList() {
  const { canCreate, canLectura } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData]   = useState({ registros: [], total: 0, total_pages: 1 })
  const [cats, setCats]   = useState({ tecnologos: [], radiologos: [], servicios: [], estudios: [] })
  const [loading, setLoading] = useState(true)

  const params = Object.fromEntries(searchParams.entries())
  const page = parseInt(params.page || '1')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, c] = await Promise.all([
        api.get('/registros', { params: { ...params, page } }),
        cats.tecnologos.length ? null : api.get('/catalogs/all'),
      ])
      setData(r.data)
      if (c) setCats(c.data)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => { load() }, [load])

  function setParam(key, val) {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val); else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function goPage(p) {
    const next = new URLSearchParams(searchParams)
    next.set('page', p)
    setSearchParams(next)
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0 fw-bold">
          <i className="fa-solid fa-list-ul me-2 text-primary" />
          Registros de Imágenes Diagnósticas
          <span className="badge bg-secondary ms-2">{data.total}</span>
        </h4>
        <div className="d-flex gap-2">
          <a href={`/exportar/excel?${searchParams}`} className="btn btn-success btn-sm">
            <i className="fa-solid fa-file-excel me-1" />Excel
          </a>
          <a href={`/exportar/txt?${searchParams}`} className="btn btn-outline-secondary btn-sm">
            <i className="fa-solid fa-file-lines me-1" />TXT
          </a>
          {canCreate && (
            <Link to="/registros/nuevo" className="btn btn-primary btn-sm">
              <i className="fa-solid fa-plus me-1" />Nuevo Estudio
            </Link>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm"
                placeholder="Desde" value={params.fecha_desde || ''}
                onChange={e => setParam('fecha_desde', e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm"
                placeholder="Hasta" value={params.fecha_hasta || ''}
                onChange={e => setParam('fecha_hasta', e.target.value)} />
            </div>
            <div className="col-md-1">
              <select className="form-select form-select-sm"
                value={params.tipo_estudio_principal || ''}
                onChange={e => setParam('tipo_estudio_principal', e.target.value)}>
                <option value="">Tipo</option>
                <option value="RX">RX</option>
                <option value="TAC">TAC</option>
                <option value="ECO">ECO</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm"
                value={params.estado || ''}
                onChange={e => setParam('estado', e.target.value)}>
                <option value="">Estado</option>
                <option value="POR CARGAR">POR CARGAR</option>
                <option>PENDIENTE</option>
                <option>LEIDO</option>
                <option>CORREGIDO</option>
                <option>ANULADO</option>
              </select>
            </div>
            <div className="col-md-2">
              <input type="text" className="form-control form-control-sm"
                placeholder="Identificación" value={params.identificacion || ''}
                onChange={e => setParam('identificacion', e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="text" className="form-control form-control-sm"
                placeholder="Nombre paciente" value={params.nombre_paciente || ''}
                onChange={e => setParam('nombre_paciente', e.target.value)} />
            </div>
            <div className="col-md-1">
              <button className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => setSearchParams({})}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover table-sm align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID Registro</th>
                  <th>Tipo</th>
                  <th>Fecha Toma</th>
                  <th>Identificación</th>
                  <th>Paciente</th>
                  <th>Estudio</th>
                  <th>Estado Carga</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.registros.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted py-4">Sin registros</td></tr>
                ) : data.registros.map(r => (
                  <tr key={r.id} className={r.estado === 'ANULADO' ? 'table-secondary opacity-75' : ''}>
                    <td><code className="small">{r.codigo_registro}</code></td>
                    <td>
                      <span className={`badge bg-${TIPOS[r.tipo_estudio_principal] || 'secondary'}`}>
                        {r.tipo_estudio_principal}
                      </span>
                    </td>
                    <td className="small">{fdt(r.fecha_hora_toma)}</td>
                    <td className="small">{r.identificacion}</td>
                    <td className="small">{r.nombre_paciente}</td>
                    <td className="small">{r.estudio_nombre}</td>
                    <td>
                      {r.estado_carga
                        ? <span className={`badge bg-${ESTADOS_CARGA[r.estado_carga] || 'secondary'}`}>{r.estado_carga}</span>
                        : <span className="text-muted small">—</span>}
                    </td>
                    <td>
                      <span className={`badge bg-${ESTADOS[r.estado] || 'secondary'}`}>
                        {r.estado}
                      </span>
                      {r.rechazada && <span className="badge bg-danger ms-1">RECHAZADA</span>}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Link to={`/registros/${r.id}`} className="btn btn-outline-primary btn-sm">
                          <i className="fa-solid fa-eye" />
                        </Link>
                        {canCreate && r.estado !== 'ANULADO' && (
                          <Link to={`/registros/${r.id}/editar`} className="btn btn-outline-secondary btn-sm">
                            <i className="fa-solid fa-pen" />
                          </Link>
                        )}
                                        {canLectura && r.estado === 'PENDIENTE' && (
                          <Link to={`/registros/${r.id}/lectura`} className="btn btn-outline-success btn-sm">
                            <i className="fa-solid fa-stethoscope" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {data.total_pages > 1 && (
            <nav>
              <ul className="pagination pagination-sm justify-content-center">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => goPage(page - 1)}>‹</button>
                </li>
                {Array.from({ length: data.total_pages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 2)
                  .map(p => (
                    <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => goPage(p)}>{p}</button>
                    </li>
                  ))}
                <li className={`page-item ${page >= data.total_pages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => goPage(page + 1)}>›</button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </>
  )
}
