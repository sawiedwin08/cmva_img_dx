import { Link } from 'react-router-dom'

const CATALOGS = [
  { key: 'estudios',       icon: 'radiation',       title: 'Estudios Radiológicos', color: 'primary' },
  { key: 'servicios',      icon: 'hospital',         title: 'Servicios',             color: 'info' },
  { key: 'profesionales',  icon: 'user-doctor',      title: 'Profesionales',         color: 'success' },
  { key: 'radiologos',     icon: 'stethoscope',      title: 'Radiólogos',            color: 'danger' },
  { key: 'tecnologos',     icon: 'user-nurse',       title: 'Tecnólogos',            color: 'warning' },
  { key: 'transcriptoras', icon: 'keyboard',         title: 'Transcriptoras',        color: 'secondary' },
  { key: 'reportes',       icon: 'file-medical',     title: 'Reportes',              color: 'dark' },
  { key: 'causas-rechazo', icon: 'circle-xmark',     title: 'Causas de Rechazo',     color: 'danger' },
  { key: 'especialidades', icon: 'graduation-cap',   title: 'Especialidades',        color: 'info' },
]

export default function CatalogsIndex() {
  return (
    <>
      <h4 className="fw-bold mb-4">
        <i className="fa-solid fa-book me-2 text-primary" />Catálogos
      </h4>
      <div className="row g-3">
        {CATALOGS.map(c => (
          <div key={c.key} className="col-md-4 col-lg-3">
            <Link to={`/catalogos/${c.key}`} className="text-decoration-none">
              <div className={`card border-${c.color} h-100 shadow-sm catalog-card`}>
                <div className="card-body text-center py-4">
                  <i className={`fa-solid fa-${c.icon} fa-2x text-${c.color} mb-2`} />
                  <div className="fw-semibold">{c.title}</div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}
