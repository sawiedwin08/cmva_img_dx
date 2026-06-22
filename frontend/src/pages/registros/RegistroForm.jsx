import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import Alert from '../../components/Alert'

const TIPO_COLORS = { RX: 'primary', TAC: 'info', ECO: 'success' }

export default function RegistroForm() {
  const { id } = useParams()
  const modo = id ? 'editar' : 'nuevo'
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [cats, setCats]     = useState(null)
  const [registro, setReg]  = useState(null)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    tipo_estudio_principal: 'RX',
    fecha_hora_orden: '',
    identificacion: '',
    nombre_paciente: '',
    contrastado_si_no: 'NO',
    estudio_id: '',
    codigo_tac: '',
    servicio_id: '',
    profesional_id: '',
    numero_tomas: '',
    kv: '',
    mas: '',
    volumen_contraste_ml: '',
    observaciones_tecnologo: '',
    tecnologo_id: '',
    reporte_id: '',
    motivo_correccion: '',
  })

  const esTAC = form.tipo_estudio_principal === 'TAC'
  const esContrastado = form.contrastado_si_no === 'SI'
  const estudios = cats?.estudios.filter(e => e.tipo === form.tipo_estudio_principal) ?? []

  // Validación en tiempo real de campos numéricos con rango
  const [fieldErrors, setFieldErrors] = useState({})

  function validateField(key, raw) {
    const val = parseFloat(raw)
    if (raw === '' || raw === '-') return ''
    if (isNaN(val)) return 'Ingrese un número válido'
    if (key === 'kv')   return val < 40  || val > 200 ? 'Debe estar entre 40 y 200'   : ''
    if (key === 'mas')  return val < 1.2 || val > 500 ? 'Debe estar entre 1.2 y 500'  : ''
    if (key === 'volumen_contraste_ml') return val < 30 || val > 200 ? 'Debe estar entre 30 y 200 ml' : ''
    return ''
  }

  function handleNumericChange(key, raw) {
    set(key, raw)
    setFieldErrors(prev => ({ ...prev, [key]: validateField(key, raw) }))
  }

  function handleNumericBlur(key, raw, min, max) {
    const val = parseFloat(raw)
    if (!isNaN(val)) {
      const clamped = Math.min(max, Math.max(min, val))
      const fixed = key === 'mas' ? String(Math.round(clamped * 10) / 10) : String(clamped)
      set(key, fixed)
      setFieldErrors(prev => ({ ...prev, [key]: '' }))
    }
  }

  useEffect(() => {
    async function load() {
      const [c, r] = await Promise.all([
        api.get('/catalogs/all'),
        id ? api.get(`/registros/${id}`) : null,
      ])
      setCats(c.data)
      if (r) {
        const reg = r.data
        setReg(reg)
        const fechaOrden = reg.fecha_hora_orden
          ? reg.fecha_hora_orden.slice(0, 16).replace(' ', 'T') : ''
        setForm({
          tipo_estudio_principal: reg.tipo_estudio_principal || 'RX',
          fecha_hora_orden: fechaOrden,
          identificacion: reg.identificacion || '',
          nombre_paciente: reg.nombre_paciente || '',
          contrastado_si_no: reg.contrastado_si_no || 'NO',
          estudio_id: reg.estudio_id || '',
          codigo_tac: reg.codigo_tac || '',
          servicio_id: reg.servicio_id || '',
          profesional_id: reg.profesional_id || '',
          numero_tomas: reg.numero_tomas || '',
          kv: reg.kv || '',
          mas: reg.mas || '',
          volumen_contraste_ml: reg.volumen_contraste_ml ?? '',
          observaciones_tecnologo: reg.observaciones_tecnologo || '',
          tecnologo_id: reg.tecnologo_id || '',
          reporte_id: reg.reporte_id || '',
          motivo_correccion: '',
        })
      } else {
        // Prellenar tecnólogo del usuario actual
        const tec = c.data.tecnologos.find(t => t.nombre === user?.nombre_completo)
        if (tec) setForm(f => ({ ...f, tecnologo_id: tec.id }))
      }
    }
    load().catch(e => setError(e.response?.data?.detail ?? 'Error cargando datos'))
  }, [id])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function validate() {
    // Forzar validación de los tres campos antes de enviar
    const kvErr  = validateField('kv',  String(form.kv))
    const masErr = validateField('mas', String(form.mas))
    const volErr = (esTAC && esContrastado && form.volumen_contraste_ml !== '')
      ? validateField('volumen_contraste_ml', String(form.volumen_contraste_ml))
      : ''

    if (kvErr || masErr || volErr) {
      setFieldErrors({ kv: kvErr, mas: masErr, volumen_contraste_ml: volErr })
      return kvErr || masErr || volErr
    }
    return null
  }

  async function submit(estadoInicial = 'PENDIENTE') {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        ...form,
        numero_tomas: parseInt(form.numero_tomas),
        kv: parseFloat(form.kv),
        mas: parseFloat(form.mas),
        volumen_contraste_ml: (esTAC && esContrastado && form.volumen_contraste_ml !== '')
          ? parseFloat(form.volumen_contraste_ml) : null,
        estudio_id: parseInt(form.estudio_id),
        servicio_id: parseInt(form.servicio_id),
        profesional_id: form.profesional_id ? parseInt(form.profesional_id) : null,
        tecnologo_id: form.tecnologo_id ? parseInt(form.tecnologo_id) : null,
        reporte_id: form.reporte_id ? parseInt(form.reporte_id) : null,
        codigo_tac: esTAC ? form.codigo_tac || null : null,
        contrastado_si_no: esTAC ? form.contrastado_si_no : 'NO',
      }
      if (modo === 'nuevo') {
        await api.post('/registros', { ...body, estado: estadoInicial })
      } else {
        await api.put(`/registros/${id}`, body)
      }
      navigate('/registros')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    submit('PENDIENTE')
  }

  if (!cats) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>

  const needsMotivo = modo === 'editar' && isAdmin && registro && ['LEIDO', 'CORREGIDO'].includes(registro.estado)

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h4 className="mb-0 fw-bold">
          {modo === 'nuevo' ? 'Nuevo Estudio' : `Editar Registro`}
        </h4>
      </div>

      <Alert type="danger" message={error} onClose={() => setError('')} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="card mb-3">
          <div className="card-header fw-semibold bg-primary text-white">
            <i className="fa-solid fa-x-ray me-2" />Tipo de Estudio
          </div>
          <div className="card-body">
            <div className="d-flex gap-3">
              {['RX', 'TAC', 'ECO'].map(t => (
                <div key={t} className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`tipo_${t}`}
                    name="tipo_estudio_principal"
                    value={t}
                    checked={form.tipo_estudio_principal === t}
                    onChange={() => { set('tipo_estudio_principal', t); set('estudio_id', '') }}
                  />
                  <label className={`form-check-label badge bg-${TIPO_COLORS[t]} fs-6`} htmlFor={`tipo_${t}`}>
                    {t === 'RX' ? '☢ Rayos X' : t === 'TAC' ? '🔬 TAC' : '🔊 Ecografía'}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header fw-semibold">Datos del Paciente y Estudio</div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Fecha/Hora Orden <span className="text-danger">*</span></label>
                <input type="datetime-local" className="form-control"
                  value={form.fecha_hora_orden}
                  onChange={e => set('fecha_hora_orden', e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Identificación <span className="text-danger">*</span></label>
                <input type="text" className="form-control"
                  value={form.identificacion}
                  onChange={e => set('identificacion', e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nombre y Apellido <span className="text-danger">*</span></label>
                <input type="text" className="form-control"
                  value={form.nombre_paciente}
                  onChange={e => set('nombre_paciente', e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Tipo Estudio <span className="text-danger">*</span></label>
                <select className="form-select" value={form.estudio_id}
                  onChange={e => set('estudio_id', e.target.value)} required>
                  <option value="">Seleccione...</option>
                  {estudios.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Servicio <span className="text-danger">*</span></label>
                <select className="form-select" value={form.servicio_id}
                  onChange={e => set('servicio_id', e.target.value)} required>
                  <option value="">Seleccione...</option>
                  {cats.servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Profesional (Médico)</label>
                <select className="form-select" value={form.profesional_id}
                  onChange={e => set('profesional_id', e.target.value)}>
                  <option value="">Seleccione...</option>
                  {cats.profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              {/* Campos exclusivos TAC */}
              {esTAC && (
                <>
                  <div className="col-md-4">
                    <label className="form-label">Contrastado</label>
                    <select className="form-select" value={form.contrastado_si_no}
                      onChange={e => set('contrastado_si_no', e.target.value)}>
                      <option value="NO">NO</option>
                      <option value="SI">SI</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Código TAC</label>
                    <input type="text" className="form-control"
                      value={form.codigo_tac}
                      onChange={e => set('codigo_tac', e.target.value)} />
                  </div>
                  {esContrastado && (
                    <div className="col-md-4">
                      <label className="form-label">
                        Volumen Contraste (ml)
                        <small className="text-muted ms-1">30 – 200</small>
                      </label>
                      <input type="number"
                        className={`form-control${fieldErrors.volumen_contraste_ml ? ' is-invalid' : (form.volumen_contraste_ml !== '' ? ' is-valid' : '')}`}
                        min={30} max={200} step="0.1"
                        value={form.volumen_contraste_ml}
                        onChange={e => handleNumericChange('volumen_contraste_ml', e.target.value)}
                        onBlur={e => handleNumericBlur('volumen_contraste_ml', e.target.value, 30, 200)} />
                      {fieldErrors.volumen_contraste_ml
                        ? <div className="invalid-feedback">{fieldErrors.volumen_contraste_ml}</div>
                        : <div className="valid-feedback">OK</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header fw-semibold">Parámetros Técnicos</div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-2">
                <label className="form-label">
                  N° Tomas <span className="text-danger">*</span>
                </label>
                <input type="number" className="form-control" min={1}
                  value={form.numero_tomas}
                  onChange={e => set('numero_tomas', e.target.value)} required />
              </div>
              <div className="col-md-2">
                <label className="form-label">
                  KV <span className="text-danger">*</span>
                  <small className="text-muted ms-1">40–200</small>
                </label>
                <input type="number"
                  className={`form-control${fieldErrors.kv ? ' is-invalid' : (form.kv !== '' ? ' is-valid' : '')}`}
                  min={40} max={200} step="0.1"
                  value={form.kv}
                  onChange={e => handleNumericChange('kv', e.target.value)}
                  onBlur={e => handleNumericBlur('kv', e.target.value, 40, 200)}
                  required />
                {fieldErrors.kv
                  ? <div className="invalid-feedback">{fieldErrors.kv}</div>
                  : <div className="valid-feedback">OK</div>}
              </div>
              <div className="col-md-2">
                <label className="form-label">
                  mAs <span className="text-danger">*</span>
                  <small className="text-muted ms-1">1.2–500</small>
                </label>
                <input type="number"
                  className={`form-control${fieldErrors.mas ? ' is-invalid' : (form.mas !== '' ? ' is-valid' : '')}`}
                  min={1.2} max={500} step="0.1"
                  value={form.mas}
                  onChange={e => handleNumericChange('mas', e.target.value)}
                  onBlur={e => handleNumericBlur('mas', e.target.value, 1.2, 500)}
                  required />
                {fieldErrors.mas
                  ? <div className="invalid-feedback">{fieldErrors.mas}</div>
                  : <div className="valid-feedback">OK</div>}
              </div>
              <div className="col-md-3">
                <label className="form-label">Tecnólogo</label>
                <select className="form-select" value={form.tecnologo_id}
                  onChange={e => set('tecnologo_id', e.target.value)}>
                  <option value="">Seleccione...</option>
                  {cats.tecnologos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Reporte</label>
                <select className="form-select" value={form.reporte_id}
                  onChange={e => set('reporte_id', e.target.value)}
                  disabled={modo === 'nuevo'}>
                  <option value="">Seleccione...</option>
                  {cats.reportes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Observaciones Tecnólogo</label>
                <textarea className="form-control" rows={2}
                  value={form.observaciones_tecnologo}
                  onChange={e => set('observaciones_tecnologo', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {needsMotivo && (
          <div className="card mb-3 border-warning">
            <div className="card-header bg-warning">Motivo de Corrección</div>
            <div className="card-body">
              <textarea className="form-control" rows={2}
                placeholder="Describa el motivo de la corrección (obligatorio)"
                value={form.motivo_correccion}
                onChange={e => set('motivo_correccion', e.target.value)}
                required />
            </div>
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end flex-wrap">
          <button type="button" className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
              : <><i className="fa-solid fa-floppy-disk me-2" />Guardar</>
            }
          </button>
        </div>
      </form>
    </>
  )
}
