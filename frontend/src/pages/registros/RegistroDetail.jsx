import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import Alert from '../../components/Alert'

const TIPOS = { RX: 'primary', TAC: 'info', ECO: 'success' }
const ESTADOS = { PENDIENTE: 'warning', LEIDO: 'success', CORREGIDO: 'info', ANULADO: 'secondary', 'POR CARGAR': 'secondary' }

const ACCION_META = {
  CREAR:      { color: 'success',   icon: 'fa-plus',          label: 'Creación' },
  MODIFICAR:  { color: 'primary',   icon: 'fa-pen',           label: 'Modificación' },
  LECTURA:    { color: 'success',   icon: 'fa-stethoscope',   label: 'Lectura radiológica' },
  CORREGIR:   { color: 'info',      icon: 'fa-rotate-left',   label: 'Corrección' },
  ANULAR:     { color: 'danger',    icon: 'fa-ban',           label: 'Anulación' },
  ACTIVAR:    { color: 'warning',   icon: 'fa-play',          label: 'Activación' },
}

function fdt(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function Row({ label, value }) {
  return (
    <div className="col-md-6 mb-2">
      <small className="text-muted d-block">{label}</small>
      <span className="fw-semibold">{value || '—'}</span>
    </div>
  )
}

export default function RegistroDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canCreate, canLectura, isAdmin } = useAuth()
  const [reg, setReg]         = useState(null)
  const [historial, setHistorial] = useState([])
  const [error, setError]     = useState('')
  const [anularModal, setAnularModal] = useState(false)
  const [motivo, setMotivo]   = useState('')
  const [anulando, setAnulando] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/registros/${id}`),
      api.get(`/registros/${id}/historial`),
    ])
      .then(([r, h]) => { setReg(r.data); setHistorial(h.data) })
      .catch(() => setError('No se pudo cargar el registro'))
  }, [id])

  async function anular() {
    if (!motivo.trim()) return
    setAnulando(true)
    try {
      await api.post(`/registros/${id}/anular`, { motivo_anulacion: motivo })
      navigate('/registros')
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Error al anular')
    } finally {
      setAnulando(false)
    }
  }

  if (!reg) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h4 className="mb-0 fw-bold flex-grow-1">
          <code>{reg.codigo_registro}</code>
          <span className={`badge bg-${TIPOS[reg.tipo_estudio_principal]} ms-2`}>{reg.tipo_estudio_principal}</span>
          <span className={`badge bg-${ESTADOS[reg.estado] || 'secondary'} ms-1`}>{reg.estado}</span>
          {reg.rechazada && <span className="badge bg-danger ms-1">RECHAZADA</span>}
        </h4>
        <div className="d-flex gap-2">
          {canCreate && reg.estado !== 'ANULADO' && (
            <Link to={`/registros/${id}/editar`} className="btn btn-outline-secondary btn-sm">
              <i className="fa-solid fa-pen me-1" />Editar
            </Link>
          )}
          {canLectura && (reg.estado === 'PENDIENTE' || reg.estado === 'CORREGIDO') && (
            <Link to={`/registros/${id}/lectura`} className="btn btn-success btn-sm">
              <i className="fa-solid fa-stethoscope me-1" />
              {reg.estado === 'CORREGIDO' ? 'Re-leer' : 'Completar Lectura'}
            </Link>
          )}
          {isAdmin && reg.estado !== 'ANULADO' && (
            <button className="btn btn-danger btn-sm" onClick={() => setAnularModal(true)}>
              <i className="fa-solid fa-ban me-1" />Anular
            </button>
          )}
        </div>
      </div>

      <Alert type="danger" message={error} onClose={() => setError('')} />

      {/* Bloque Tecnólogo */}
      <div className="card mb-3">
        <div className="card-header fw-semibold bg-primary text-white">
          <i className="fa-solid fa-user-nurse me-2" />Datos del Tecnólogo
        </div>
        <div className="card-body">
          <div className="row">
            <Row label="Fecha/Hora Toma"   value={fdt(reg.fecha_hora_toma)} />
            <Row label="Fecha/Hora Orden"  value={fdt(reg.fecha_hora_orden)} />
            <Row label="Identificación"    value={reg.identificacion} />
            <Row label="Nombre y Apellido" value={reg.nombre_paciente} />
            <Row label="Contrastado"       value={reg.contrastado_si_no} />
            {reg.tipo_estudio_principal === 'TAC' && (
              <Row label="Toma 3D" value={reg.toma_3d_si_no} />
            )}
            <Row label="Tipo Estudio"      value={reg.estudio_nombre} />
            {reg.tipo_estudio_principal === 'TAC' && (
              <Row label="Código TAC" value={reg.codigo_tac} />
            )}
            <Row label="Servicio"          value={reg.servicio_nombre} />
            <Row label="Profesional"       value={reg.profesional_nombre} />
            <Row label="N° Tomas"          value={reg.numero_tomas} />
            <Row label="KV"                value={reg.kv} />
            <Row label="mAs"               value={reg.mas} />
            {reg.volumen_contraste_ml != null && (
              <Row label="Volumen Contraste (ml)" value={reg.volumen_contraste_ml} />
            )}
            <Row label="Tecnólogo"         value={reg.tecnologo_nombre} />
            <Row label="Reporte"           value={reg.reporte_nombre} />
            {reg.observaciones_tecnologo && (
              <div className="col-12 mb-2">
                <small className="text-muted d-block">Observaciones Tecnólogo</small>
                <span>{reg.observaciones_tecnologo}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bloque Radiólogo */}
      <div className="card mb-3">
        <div className="card-header fw-semibold bg-success text-white">
          <i className="fa-solid fa-stethoscope me-2" />Lectura Radiológica
        </div>
        <div className="card-body">
          {reg.estado === 'PENDIENTE' ? (
            <p className="text-muted mb-0">
              <i className="fa-solid fa-clock me-2" />Pendiente de lectura por el radiólogo
            </p>
          ) : reg.estado === 'CORREGIDO' && !reg.radiologo_id ? (
            <p className="text-muted mb-0">
              <i className="fa-solid fa-rotate-left me-2" />Corregido por el tecnólogo — pendiente de re-lectura
            </p>
          ) : (
            <div className="row">
              <Row label="Fecha/Hora Lectura"           value={fdt(reg.fecha_hora_lectura_radiologo)} />
              <Row label="Radiólogo (LECTURA_RADIOLOGO)" value={reg.radiologo_nombre} />
              <Row label="Transcriptora"                 value={reg.transcriptora_nombre} />
              <Row label="Rechazada"                     value={reg.rechazada ? 'SI' : 'NO'} />
              {reg.rechazada && <Row label="Causa de Rechazo" value={reg.causa_rechazo} />}
              {reg.lectura_radiologo && (
                <div className="col-12 mb-2">
                  <small className="text-muted d-block">OBSERVACION_RADIOLOGO (Informe)</small>
                  <div className="border rounded p-2 bg-light">{reg.lectura_radiologo}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {reg.motivo_anulacion && (
        <div className="alert alert-danger">
          <strong>Motivo de anulación:</strong> {reg.motivo_anulacion}
        </div>
      )}

      {/* Historial de cambios */}
      <div className="card mb-3">
        <div className="card-header fw-semibold bg-dark text-white d-flex align-items-center gap-2">
          <i className="fa-solid fa-clock-rotate-left" />
          Historial de Cambios
          <span className="badge bg-secondary ms-auto">{historial.length}</span>
        </div>
        <div className="card-body p-0">
          {historial.length === 0 ? (
            <p className="text-muted p-3 mb-0">Sin registros de auditoría.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 155 }}>Fecha / Hora</th>
                    <th style={{ width: 110 }}>Acción</th>
                    <th>Usuario</th>
                    <th>Perfil</th>
                    <th>Motivo de corrección</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(h => {
                    const meta = ACCION_META[h.accion] || { color: 'secondary', icon: 'fa-circle', label: h.accion }
                    return (
                      <tr key={h.id}>
                        <td className="small text-muted">{fdt(h.fecha_hora)}</td>
                        <td>
                          <span className={`badge bg-${meta.color}`}>
                            <i className={`fa-solid ${meta.icon} me-1`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="small">{h.usuario || '—'}</td>
                        <td>
                          {h.rol && (
                            <span className="badge bg-light text-dark border small">{h.rol}</span>
                          )}
                        </td>
                        <td className="small fst-italic text-muted">
                          {h.motivo_correccion || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal anular */}
      {anularModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title"><i className="fa-solid fa-ban me-2" />Anular Registro</h5>
                <button className="btn-close btn-close-white" onClick={() => setAnularModal(false)} />
              </div>
              <div className="modal-body">
                <p>¿Está seguro de anular <strong>{reg.codigo_registro}</strong>? Esta acción no se puede deshacer.</p>
                <textarea className="form-control" rows={3}
                  placeholder="Motivo de anulación (obligatorio)"
                  value={motivo} onChange={e => setMotivo(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setAnularModal(false)}>Cancelar</button>
                <button className="btn btn-danger" onClick={anular} disabled={!motivo.trim() || anulando}>
                  {anulando ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Anular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
