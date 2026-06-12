import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  ArcElement, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, Title,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import api from '../api/client'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

const TIPO_COLORS = { RX: '#0d6efd', TAC: '#0dcaf0', ECO: '#198754' }

export default function Dashboard() {
  const [sp, setSP] = useSearchParams()
  const navigate = useNavigate()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  const params = Object.fromEntries(sp.entries())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/dashboard', { params })
      setData(r.data)
    } finally {
      setLoading(false)
    }
  }, [sp])

  useEffect(() => { load() }, [load])

  function setParam(k, v) {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v); else n.delete(k)
    setSP(n)
  }

  if (loading || !data) return (
    <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
  )

  const { kpis, por_tipo, por_servicio, por_estudio, por_tecnologo, por_radiologo } = data

  const doughnutData = {
    labels: por_tipo.map(t => t.nombre),
    datasets: [{ data: por_tipo.map(t => t.count), backgroundColor: por_tipo.map(t => TIPO_COLORS[t.tipo] || '#999') }],
  }

  const barServicio = {
    labels: por_servicio.slice(0, 8).map(s => s.nombre),
    datasets: [{ label: 'Registros', data: por_servicio.slice(0, 8).map(s => s.count), backgroundColor: '#0d6efd88' }],
  }

  const barEstudio = {
    labels: por_estudio.slice(0, 10).map(s => s.nombre.slice(0, 30)),
    datasets: [{ label: 'Registros', data: por_estudio.slice(0, 10).map(s => s.count), backgroundColor: '#19875488' }],
  }

  const barOpts = (title) => ({
    responsive: true,
    plugins: { legend: { display: false }, title: { display: true, text: title } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  })

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0 fw-bold"><i className="fa-solid fa-chart-bar me-2 text-primary" />Dashboard</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setSP({})}>
          <i className="fa-solid fa-xmark me-1" />Limpiar filtros
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm"
                value={params.fecha_desde || ''} onChange={e => setParam('fecha_desde', e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm"
                value={params.fecha_hasta || ''} onChange={e => setParam('fecha_hasta', e.target.value)} />
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm"
                value={params.tipo_estudio_principal || ''}
                onChange={e => setParam('tipo_estudio_principal', e.target.value)}>
                <option value="">Todos los tipos</option>
                <option value="RX">Rayos X</option>
                <option value="TAC">TAC</option>
                <option value="ECO">Ecografía</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card text-center border-primary">
            <div className="card-body py-2">
              <div className="fs-2 fw-bold text-primary">{kpis.total}</div>
              <small className="text-muted">Total Registros</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center border-warning">
            <div className="card-body py-2">
              <div className="fs-2 fw-bold text-warning">{kpis.pendientes}</div>
              <small className="text-muted">Pendientes</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center border-success">
            <div className="card-body py-2">
              <div className="fs-2 fw-bold text-success">{kpis.leidos}</div>
              <small className="text-muted">Leídos</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center border-danger">
            <div className="card-body py-2">
              <div className="fs-2 fw-bold text-danger">{kpis.rechazados}</div>
              <small className="text-muted">Rechazados ({kpis.pct_rechazados}%)</small>
            </div>
          </div>
        </div>
      </div>

      {/* KPI por tipo */}
      <div className="row g-3 mb-4">
        {por_tipo.map(t => (
          <div key={t.tipo} className="col-md-4">
            <div
              className="card text-center h-100 border-0 shadow-sm"
              style={{ cursor: 'pointer', borderLeft: `4px solid ${TIPO_COLORS[t.tipo]}` }}
              onClick={() => setParam('tipo_estudio_principal', params.tipo_estudio_principal === t.tipo ? '' : t.tipo)}
            >
              <div className="card-body py-3">
                <div className="fs-1 fw-bold" style={{ color: TIPO_COLORS[t.tipo] }}>{t.count}</div>
                <div className="fw-semibold">{t.nombre}</div>
                {params.tipo_estudio_principal === t.tipo && (
                  <span className="badge bg-secondary mt-1">Filtro activo</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header fw-semibold">Distribución por Tipo</div>
            <div className="card-body d-flex justify-content-center align-items-center">
              <div style={{ maxWidth: 280 }}>
                <Doughnut data={doughnutData} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header fw-semibold">Por Servicio</div>
            <div className="card-body">
              <Bar data={barServicio} options={barOpts('Registros por Servicio')} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header fw-semibold">Top 10 Estudios</div>
            <div className="card-body">
              <Bar data={barEstudio} options={{ ...barOpts('Estudios más frecuentes'), indexAxis: 'y' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tablas */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header fw-semibold">Por Tecnólogo</div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead><tr><th>Tecnólogo</th><th className="text-end">Total</th></tr></thead>
                <tbody>
                  {por_tecnologo.map(t => (
                    <tr key={t.nombre}>
                      <td>{t.nombre}</td>
                      <td className="text-end"><span className="badge bg-primary">{t.count}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header fw-semibold">Por Radiólogo</div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead><tr><th>Radiólogo</th><th className="text-end">Total</th></tr></thead>
                <tbody>
                  {por_radiologo.length === 0 ? (
                    <tr><td colSpan={2} className="text-muted text-center">Sin lecturas</td></tr>
                  ) : por_radiologo.map(r => (
                    <tr key={r.nombre}>
                      <td>{r.nombre}</td>
                      <td className="text-end"><span className="badge bg-success">{r.count}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
