export default function Manual() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">
          <i className="fa-solid fa-book-open me-2 text-primary" />Manual de Usuario
        </h4>
        <button className="btn btn-outline-primary btn-sm" onClick={() => window.print()}>
          <i className="fa-solid fa-print me-1" />Imprimir / PDF
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div id="manual-content">
            <h5>1. Introducción</h5>
            <p>
              El sistema <strong>CMVA – Imágenes Diagnósticas</strong> permite registrar y gestionar estudios radiológicos
              (Rayos X, TAC y Ecografías), controlar el flujo tecnólogo → radiólogo, y generar reportes estadísticos.
            </p>

            <h5>2. Roles del Sistema</h5>
            <table className="table table-bordered table-sm">
              <thead className="table-dark"><tr><th>Rol</th><th>Acceso</th></tr></thead>
              <tbody>
                <tr><td><strong>ADMINISTRADOR</strong></td><td>Acceso total: registros, lecturas, catálogos, usuarios, auditoría, dashboard</td></tr>
                <tr><td><strong>TECNOLOGO</strong></td><td>Crear y editar registros (campos técnicos: A–R)</td></tr>
                <tr><td><strong>RADIOLOGO</strong></td><td>Completar lectura radiológica (campos S–Y), ver lista de pendientes</td></tr>
                <tr><td><strong>CONSULTA/GERENCIA</strong></td><td>Ver registros y dashboard (solo lectura)</td></tr>
              </tbody>
            </table>

            <h5>3. Flujo de un Estudio</h5>
            <ol>
              <li>El <strong>Tecnólogo</strong> crea el registro con los datos del paciente, parámetros técnicos y tipo de estudio.</li>
              <li>El registro queda en estado <span className="badge bg-warning text-dark">PENDIENTE</span>.</li>
              <li>El <strong>Radiólogo</strong> abre el registro pendiente, ingresa el informe y completa la lectura.</li>
              <li>El registro pasa a estado <span className="badge bg-success">LEIDO</span>.</li>
              <li>Si el estudio es rechazado, se selecciona la causa de rechazo.</li>
            </ol>

            <h5>4. Crear un Registro (Tecnólogo)</h5>
            <p>Ir a <strong>Nuevo Estudio</strong> en el menú lateral. Seleccionar primero el tipo de estudio:</p>
            <ul>
              <li><span className="badge bg-primary">RX</span> Rayos X</li>
              <li><span className="badge bg-info text-dark">TAC</span> Tomografía Axial Computarizada</li>
              <li><span className="badge bg-success">ECO</span> Ecografía</li>
            </ul>
            <p>Campos obligatorios: Fecha/Hora Orden, Identificación, Paciente, Tipo Estudio, Servicio, N° Tomas, KV y mAs.</p>
            <p><strong>Rangos válidos:</strong> KV: 40–200 | mAs: 1.2–500 | Volumen contraste (solo TAC contrastado): 30–200 ml.</p>
            <p>El ID de registro se genera automáticamente con el formato <code>RX-AAAA-MM-NNNNNN</code>.</p>

            <h5>5. Completar Lectura (Radiólogo)</h5>
            <p>Desde la lista de registros, los estudios <span className="badge bg-warning text-dark">PENDIENTE</span> muestran el botón de lectura.
            El radiólogo selecciona su nombre, escribe el informe radiológico en <strong>OBSERVACION_RADIOLOGO</strong>,
            e indica si el estudio fue rechazado.</p>

            <h5>6. Filtros y Búsqueda</h5>
            <p>La lista de registros permite filtrar por: rango de fechas, tipo de estudio, estado, identificación y nombre del paciente.
            También por tecnólogo, radiólogo y servicio.</p>

            <h5>7. Exportación de Datos</h5>
            <p>Los botones <strong>Excel</strong> y <strong>TXT</strong> exportan los registros según los filtros activos.
            El archivo contiene las 25 columnas de la PLANTILLA institucional.</p>

            <h5>8. Dashboard</h5>
            <p>Disponible para Administrador y Consulta/Gerencia. Muestra KPIs (total, pendientes, leídos, rechazados),
            distribución por tipo de estudio, gráficas por servicio y estudio, y tablas de productividad por tecnólogo y radiólogo.</p>

            <h5>9. Catálogos (Administrador)</h5>
            <p>Desde el menú <strong>Catálogos</strong> se gestionan: Estudios, Servicios, Profesionales, Radiólogos,
            Tecnólogos, Transcriptoras, Reportes, Causas de Rechazo y Especialidades.
            Cada catálogo permite agregar, editar y activar/inactivar registros.</p>

            <h5>10. Gestión de Usuarios (Administrador)</h5>
            <p>Desde <strong>Usuarios</strong> se crean, editan y activan/inactivan los usuarios del sistema.
            Al crear un usuario se asigna rol, usuario de login y contraseña.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          nav, .cmva-navbar, .cmva-sidebar, button, .btn { display: none !important; }
          #manual-content { font-size: 12pt; }
        }
      `}</style>
    </>
  )
}
