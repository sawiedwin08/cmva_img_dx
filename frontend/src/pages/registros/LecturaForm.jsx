import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import Alert from '../../components/Alert'

function fdt(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function InfoRow({ label, value }) {
  return (
    <div className="col-md-4 mb-1">
      <small className="text-muted">{label}</small>
      <div className="fw-semibold small">{value || '—'}</div>
    </div>
  )
}

export default function LecturaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reg, setReg]     = useState(null)
  const [cats, setCats]   = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    rechazada: 'NO',
    causa_rechazo_id: '',
    radiologo_id: '',
    transcriptora_id: '',
    lectura_radiologo: '',
  })

  useEffect(() => {
    async function load() {
      const [r, c] = await Promise.all([
        api.get(`/registros/${id}`),
        api.get('/catalogs/all'),
      ])
      setReg(r.data)
      setCats(c.data)
      // Prellenar radiólogo del usuario actual
      const rad = c.data.radiologos.find(r => r.nombre === user?.nombre_completo)
      if (rad) setForm(f => ({ ...f, radiologo_id: rad.id }))
    }
    load().catch(e => setError(e.response?.data?.detail ?? 'Error cargando datos'))
  }, [id])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.radiologo_id) { setError('Debe seleccionar el radiólogo'); return }
    setSaving(true)
    setError('')
    try {
      await api.post(`/registros/${id}/lectura`, {
        ...form,
        radiologo_id: parseInt(form.radiologo_id),
        causa_rechazo_id: form.causa_rechazo_id ? parseInt(form.causa_rechazo_id) : null,
        transcriptora_id: form.transcriptora_id ? parseInt(form.transcriptora_id) : null,
      })
      navigate(`/registros/${id}`)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Error al guardar la lectura')
    } finally {
      setSaving(false)
    }
  }

  if (!reg || !cats) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>

  const causasValidas = cats.causas_rechazo?.filter(c => c.descripcion !== 'NA') ?? []

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h4 className="mb-0 fw-bold">
          Lectura Radiológica — <code>{reg.codigo_registro}</code>
        </h4>
      </div>

      <Alert type="danger" message={error} onClose={() => setError('')} />

      {/* Resumen del tecnólogo — solo lectura */}
      <div className="card mb-3 border-primary">
        <div className="card-header bg-primary text-white fw-semibold">
          <i className="fa-solid fa-user-nurse me-2" />Datos del Tecnólogo (solo lectura)
        </div>
        <div className="card-body py-2">
          <div className="row">
            <InfoRow label="ID Registro"       value={reg.codigo_registro} />
            <InfoRow label="Fecha Toma"        value={fdt(reg.fecha_hora_toma)} />
            <InfoRow label="Fecha Orden"       value={fdt(reg.fecha_hora_orden)} />
            <InfoRow label="Identificación"    value={reg.identificacion} />
            <InfoRow label="Paciente"          value={reg.nombre_paciente} />
            <InfoRow label="Tipo"              value={reg.tipo_estudio_principal} />
            <InfoRow label="Contrastado"       value={reg.contrastado_si_no} />
            <InfoRow label="Estudio"           value={reg.estudio_nombre} />
            {reg.codigo_tac && <InfoRow label="Código TAC" value={reg.codigo_tac} />}
            <InfoRow label="Servicio"          value={reg.servicio_nombre} />
            <InfoRow label="Profesional"       value={reg.profesional_nombre} />
            <InfoRow label="N° Tomas"          value={reg.numero_tomas} />
            <InfoRow label="KV"                value={reg.kv} />
            <InfoRow label="mAs"               value={reg.mas} />
            {reg.volumen_contraste_ml != null && (
              <InfoRow label="Volumen Contraste (ml)" value={reg.volumen_contraste_ml} />
            )}
            <InfoRow label="Tecnólogo"         value={reg.tecnologo_nombre} />
            <InfoRow label="Reporte"           value={reg.reporte_nombre} />
            {reg.observaciones_tecnologo && (
              <div className="col-12 mt-1">
                <small className="text-muted">Observaciones Tecnólogo</small>
                <div className="small">{reg.observaciones_tecnologo}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulario del radiólogo */}
      <form onSubmit={handleSubmit}>
        <div className="card mb-3">
          <div className="card-header fw-semibold bg-success text-white">
            <i className="fa-solid fa-stethoscope me-2" />Lectura Radiológica
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Rechazada</label>
                <select className="form-select" value={form.rechazada}
                  onChange={e => { set('rechazada', e.target.value); set('causa_rechazo_id', '') }}>
                  <option value="NO">NO</option>
                  <option value="SI">SI</option>
                </select>
              </div>

              {form.rechazada === 'SI' && (
                <div className="col-md-4">
                  <label className="form-label">Causa de Rechazo <span className="text-danger">*</span></label>
                  <select className="form-select" value={form.causa_rechazo_id}
                    onChange={e => set('causa_rechazo_id', e.target.value)} required>
                    <option value="">Seleccione...</option>
                    {causasValidas.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
                  </select>
                </div>
              )}

              <div className="col-md-4">
                <label className="form-label">
                  Radiólogo (LECTURA_RADIOLOGO) <span className="text-danger">*</span>
                </label>
                <select className="form-select" value={form.radiologo_id}
                  onChange={e => set('radiologo_id', e.target.value)} required>
                  <option value="">Seleccione...</option>
                  {cats.radiologos.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Transcriptora</label>
                <select className="form-select" value={form.transcriptora_id}
                  onChange={e => set('transcriptora_id', e.target.value)}>
                  <option value="">Seleccione...</option>
                  {cats.transcriptoras.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">
                  OBSERVACION_RADIOLOGO (Texto del informe)
                </label>
                <textarea className="form-control" rows={5}
                  placeholder="Escriba el informe radiológico completo aquí..."
                  value={form.lectura_radiologo}
                  onChange={e => set('lectura_radiologo', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-success" disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
              : <><i className="fa-solid fa-check me-2" />Guardar Lectura</>
            }
          </button>
        </div>
      </form>
    </>
  )
}
