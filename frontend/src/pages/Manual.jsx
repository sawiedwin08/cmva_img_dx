function Sec({ id, icon, title, children }) {
  return (
    <section id={id} className="mb-5">
      <h5 className="fw-bold border-bottom pb-2 mb-3" style={{ color: '#0d6efd' }}>
        <i className={`fa-solid ${icon} me-2`} />{title}
      </h5>
      {children}
    </section>
  )
}

function Step({ n, children }) {
  return (
    <div className="d-flex gap-3 mb-2 align-items-start">
      <span className="badge bg-primary rounded-circle fs-6 flex-shrink-0"
        style={{ width: 32, height: 32, lineHeight: '20px', textAlign: 'center' }}>{n}</span>
      <div className="pt-1">{children}</div>
    </div>
  )
}

function Tip({ children }) {
  return (
    <div className="alert alert-info alert-sm d-flex gap-2 py-2 mb-2">
      <i className="fa-solid fa-lightbulb mt-1 flex-shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function Warn({ children }) {
  return (
    <div className="alert alert-warning alert-sm d-flex gap-2 py-2 mb-2">
      <i className="fa-solid fa-triangle-exclamation mt-1 flex-shrink-0" />
      <span>{children}</span>
    </div>
  )
}

const TOC = [
  ['#intro',        'fa-circle-info',      '1. ¿Para qué sirve el sistema?'],
  ['#perfiles',     'fa-users',            '2. Perfiles y permisos'],
  ['#acceso',       'fa-right-to-bracket', '3. Acceso al sistema'],
  ['#estados',      'fa-tag',              '4. Estados de un estudio'],
  ['#flujo',        'fa-diagram-project',  '5. Flujo completo de un estudio'],
  ['#tecnologo',    'fa-user-nurse',       '6. Crear / editar un registro (Tecnólogo)'],
  ['#radiologo',    'fa-stethoscope',      '7. Completar lectura radiológica (Radiólogo)'],
  ['#lista',        'fa-list-ul',          '8. Lista de registros y búsqueda'],
  ['#exportar',     'fa-file-export',      '9. Exportar datos (Excel / TXT)'],
  ['#dashboard',    'fa-chart-pie',        '10. Dashboard y estadísticas'],
  ['#catalogos',    'fa-book',             '11. Catálogos (Administrador)'],
  ['#usuarios',     'fa-user-gear',        '12. Gestión de usuarios (Administrador)'],
]

export default function Manual() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0">
          <i className="fa-solid fa-book-open me-2 text-primary" />Manual de Usuario — CMVA Imágenes Diagnósticas
        </h4>
        <button className="btn btn-outline-primary btn-sm" onClick={() => window.print()}>
          <i className="fa-solid fa-print me-1" />Imprimir / Guardar PDF
        </button>
      </div>

      <div className="row g-3">

        {/* Índice lateral */}
        <div className="col-lg-3 d-print-none">
          <div className="card sticky-top" style={{ top: 80 }}>
            <div className="card-header fw-semibold bg-dark text-white py-2">
              <i className="fa-solid fa-list me-2" />Contenido
            </div>
            <div className="list-group list-group-flush">
              {TOC.map(([href, icon, label]) => (
                <a key={href} href={href}
                  className="list-group-item list-group-item-action py-1 px-3 small">
                  <i className={`fa-solid ${icon} me-2 text-primary`} />{label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="col-lg-9">
          <div className="card">
            <div className="card-body" id="manual-content">

              {/* 1. Para qué sirve */}
              <Sec id="intro" icon="fa-circle-info" title="1. ¿Para qué sirve el sistema?">
                <p>
                  <strong>CMVA – Imágenes Diagnósticas</strong> es el sistema de registro y gestión de estudios
                  radiológicos del centro. Centraliza en una sola plataforma web todo el proceso:
                  desde que el tecnólogo toma el estudio hasta que el radiólogo emite el informe,
                  pasando por el control de estado y la generación de reportes estadísticos.
                </p>
                <div className="row g-3 mb-2">
                  {[
                    ['fa-x-ray',       'primary', 'Rayos X (RX)',       'Registro de radiografías con parámetros KV y mAs.'],
                    ['fa-microscope',   'info',    'TAC',                'Tomografías, con soporte para estudios contrastados y volumen de contraste.'],
                    ['fa-wave-square',  'success', 'Ecografía (ECO)',    'Registro de ultrasonidos y ecografías.'],
                  ].map(([icon, color, titulo, desc]) => (
                    <div key={titulo} className="col-md-4">
                      <div className={`card border-${color} h-100`}>
                        <div className={`card-header bg-${color} text-white py-1 fw-semibold small`}>
                          <i className={`fa-solid ${icon} me-1`} />{titulo}
                        </div>
                        <div className="card-body py-2 small">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mb-0">
                  Además el sistema permite <strong>exportar</strong> los datos a Excel o TXT con el formato
                  de la plantilla institucional, y visualizar <strong>estadísticas</strong> de productividad
                  por tecnólogo, radiólogo, servicio y tipo de estudio.
                </p>
              </Sec>

              {/* 2. Perfiles */}
              <Sec id="perfiles" icon="fa-users" title="2. Perfiles y permisos">
                <p>El sistema tiene cuatro perfiles. Cada usuario tiene asignado exactamente uno.</p>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>Perfil</th>
                        <th>¿Qué puede hacer?</th>
                        <th>¿Qué NO puede hacer?</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <span className="badge bg-danger fs-6">ADMINISTRADOR</span>
                        </td>
                        <td>
                          <ul className="mb-0 ps-3 small">
                            <li>Ver, crear y editar cualquier registro</li>
                            <li>Completar lecturas radiológicas</li>
                            <li>Corregir registros en estado LEIDO o CORREGIDO</li>
                            <li>Gestionar catálogos (estudios, servicios, etc.)</li>
                            <li>Crear, editar y activar/inactivar usuarios</li>
                            <li>Ver el Dashboard y estadísticas</li>
                            <li>Exportar Excel y TXT</li>
                          </ul>
                        </td>
                        <td className="small text-muted">Sin restricciones</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="badge bg-primary fs-6">TECNÓLOGO</span>
                        </td>
                        <td>
                          <ul className="mb-0 ps-3 small">
                            <li>Crear nuevos registros (Nuevo Estudio)</li>
                            <li>Editar registros que no estén ANULADOS</li>
                            <li>Ver el detalle de cualquier registro</li>
                            <li>Exportar Excel y TXT</li>
                          </ul>
                        </td>
                        <td>
                          <ul className="mb-0 ps-3 small text-danger">
                            <li>No puede completar la lectura radiológica</li>
                            <li>No accede a catálogos ni usuarios</li>
                            <li>No ve el Dashboard</li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span className="badge bg-success fs-6">RADIÓLOGO</span>
                        </td>
                        <td>
                          <ul className="mb-0 ps-3 small">
                            <li>Ver la lista de registros</li>
                            <li>Completar la lectura en registros PENDIENTE</li>
                            <li>Ver el detalle de cualquier registro</li>
                            <li>Exportar Excel y TXT</li>
                          </ul>
                        </td>
                        <td>
                          <ul className="mb-0 ps-3 small text-danger">
                            <li>No puede crear ni editar datos del tecnólogo</li>
                            <li>No accede a catálogos ni usuarios</li>
                            <li>No ve el Dashboard</li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span className="badge bg-secondary fs-6">CONSULTA / GERENCIA</span>
                        </td>
                        <td>
                          <ul className="mb-0 ps-3 small">
                            <li>Ver la lista de registros (solo lectura)</li>
                            <li>Ver el detalle de cualquier registro</li>
                            <li>Ver el Dashboard y estadísticas</li>
                            <li>Exportar Excel y TXT</li>
                          </ul>
                        </td>
                        <td>
                          <ul className="mb-0 ps-3 small text-danger">
                            <li>No puede crear, editar ni completar lecturas</li>
                            <li>No accede a catálogos ni usuarios</li>
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Tip>
                  El menú lateral muestra solo las opciones que su perfil tiene permitidas.
                  Si no ve una opción, es porque su perfil no tiene acceso a esa función.
                </Tip>
              </Sec>

              {/* 3. Acceso */}
              <Sec id="acceso" icon="fa-right-to-bracket" title="3. Acceso al sistema">
                <Step n="1">
                  Abra el navegador (Chrome o Edge recomendado) e ingrese la dirección del sistema
                  que le proporcionó el administrador.
                </Step>
                <Step n="2">
                  En la pantalla de inicio de sesión ingrese su <strong>usuario</strong> y
                  <strong> contraseña</strong> asignados por el administrador. Luego haga clic en
                  <strong> Ingresar</strong>.
                </Step>
                <Step n="3">
                  Si las credenciales son correctas, el sistema lo llevará al menú principal
                  según su perfil.
                </Step>
                <Warn>
                  Si olvidó su contraseña, comuníquese con el administrador del sistema para
                  que la restablezca. El sistema no tiene recuperación de contraseña por correo.
                </Warn>
                <p className="mb-0">
                  Para salir, haga clic en el botón <strong>Cerrar sesión</strong> en la esquina
                  superior derecha de la pantalla.
                </p>
              </Sec>

              {/* 4. Estados */}
              <Sec id="estados" icon="fa-tag" title="4. Estados de un estudio">
                <p>Cada registro pasa por los siguientes estados a lo largo de su ciclo de vida:</p>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-dark">
                      <tr><th>Estado</th><th>Significado</th><th>¿Quién lo asigna?</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="badge bg-warning text-dark">POR CARGAR</span></td>
                        <td className="small">El registro fue creado pero aún no se han cargado todos los datos del tecnólogo.</td>
                        <td className="small">Sistema (automático al crear)</td>
                      </tr>
                      <tr>
                        <td><span className="badge bg-primary">PENDIENTE</span></td>
                        <td className="small">El tecnólogo completó el registro y está esperando lectura del radiólogo.</td>
                        <td className="small">Tecnólogo al guardar el registro completo</td>
                      </tr>
                      <tr>
                        <td><span className="badge bg-success">LEIDO</span></td>
                        <td className="small">El radiólogo completó la lectura radiológica e ingresó el informe.</td>
                        <td className="small">Radiólogo al guardar la lectura</td>
                      </tr>
                      <tr>
                        <td><span className="badge bg-info text-dark">CORREGIDO</span></td>
                        <td className="small">El administrador realizó una corrección sobre un registro LEIDO o CORREGIDO.</td>
                        <td className="small">Administrador</td>
                      </tr>
                      <tr>
                        <td><span className="badge bg-secondary">ANULADO</span></td>
                        <td className="small">El registro fue anulado y no se puede editar.</td>
                        <td className="small">Administrador</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mb-0 small text-muted">
                  La columna <strong>Reporte</strong> en la lista muestra adicionalmente si el estudio
                  está <span className="badge bg-warning text-dark">POR CARGAR</span> o{' '}
                  <span className="badge bg-success">CARGADO</span> según si tiene reporte asignado.
                </p>
              </Sec>

              {/* 5. Flujo */}
              <Sec id="flujo" icon="fa-diagram-project" title="5. Flujo completo de un estudio">
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                  {[
                    ['bg-primary',        'TECNÓLOGO crea el registro'],
                    ['bg-warning text-dark','Estado: PENDIENTE'],
                    ['bg-success',         'RADIÓLOGO completa la lectura'],
                    ['bg-success',         'Estado: LEIDO'],
                  ].map(([badge, label], i, arr) => (
                    <div key={i} className="d-flex align-items-center gap-2">
                      <span className={`badge ${badge} px-3 py-2`}>{label}</span>
                      {i < arr.length - 1 && <i className="fa-solid fa-arrow-right text-muted" />}
                    </div>
                  ))}
                </div>
                <ol className="small">
                  <li className="mb-1">El <strong>Tecnólogo</strong> ingresa al sistema y crea un Nuevo Estudio con los datos del paciente y los parámetros técnicos (KV, mAs, N° tomas, etc.).</li>
                  <li className="mb-1">Al guardar, el registro queda en estado <span className="badge bg-warning text-dark">PENDIENTE</span> y aparece en la lista para que el radiólogo lo atienda.</li>
                  <li className="mb-1">El <strong>Radiólogo</strong> busca los registros PENDIENTE, abre el ícono de lectura (<i className="fa-solid fa-stethoscope" />) y completa el informe radiológico.</li>
                  <li className="mb-1">Al guardar la lectura, el estado pasa a <span className="badge bg-success">LEIDO</span>.</li>
                  <li className="mb-1">Si el estudio fue rechazado, el radiólogo marca <strong>Rechazada: SI</strong> y selecciona la causa de rechazo.</li>
                  <li className="mb-1">El <strong>Administrador</strong> puede exportar los datos en cualquier momento o corregir registros ya leídos (con motivo de corrección obligatorio).</li>
                </ol>
              </Sec>

              {/* 6. Tecnólogo — Crear registro */}
              <Sec id="tecnologo" icon="fa-user-nurse" title="6. Crear / Editar un registro (Tecnólogo)">
                <p>
                  <span className="badge bg-primary">TECNÓLOGO</span>{' '}
                  <span className="badge bg-danger">ADMINISTRADOR</span>{' '}
                  <small className="text-muted ms-1">— Perfiles con acceso a esta función</small>
                </p>

                <h6 className="fw-bold mt-3">6.1 Crear un nuevo registro</h6>
                <Step n="1">
                  En el menú lateral haga clic en <strong>Nuevo Estudio</strong> (ícono <i className="fa-solid fa-plus" />).
                </Step>
                <Step n="2">
                  Seleccione el <strong>tipo de estudio</strong> haciendo clic en uno de los tres botones:
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <span className="badge bg-primary px-3 py-2">☢ Rayos X (RX)</span>
                    <span className="badge bg-info text-dark px-3 py-2">🔬 TAC</span>
                    <span className="badge bg-success px-3 py-2">🔊 Ecografía (ECO)</span>
                  </div>
                  <div className="mt-1 small text-muted">
                    El tipo de estudio determina cuáles estudios aparecen en el selector y si se muestran
                    campos exclusivos de TAC (Contrastado, Código TAC, Volumen Contraste).
                  </div>
                </Step>
                <Step n="3">
                  Complete los <strong>Datos del Paciente y Estudio</strong>:
                  <div className="table-responsive mt-2">
                    <table className="table table-sm table-bordered small">
                      <thead className="table-light">
                        <tr><th>Campo</th><th>Descripción</th><th>Obligatorio</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>Fecha/Hora Orden</td><td>Fecha y hora en que se realizó la orden médica</td><td className="text-center text-danger fw-bold">Sí</td></tr>
                        <tr><td>Identificación</td><td>Número de documento del paciente (CC, TI, etc.)</td><td className="text-center text-danger fw-bold">Sí</td></tr>
                        <tr><td>Nombre y Apellido</td><td>Nombre completo del paciente</td><td className="text-center text-danger fw-bold">Sí</td></tr>
                        <tr><td>Tipo Estudio</td><td>Nombre específico del estudio (ej. Tórax AP, Columna Lumbar...)</td><td className="text-center text-danger fw-bold">Sí</td></tr>
                        <tr><td>Servicio</td><td>Servicio de origen del paciente (urgencias, consulta externa, etc.)</td><td className="text-center text-danger fw-bold">Sí</td></tr>
                        <tr><td>Profesional (Médico)</td><td>Médico que ordenó el estudio</td><td className="text-center text-muted">No</td></tr>
                        <tr><td>Contrastado</td><td>Solo TAC: SI / NO si se usó contraste</td><td className="text-center text-muted">Solo TAC</td></tr>
                        <tr><td>Código TAC</td><td>Solo TAC: código interno del equipo</td><td className="text-center text-muted">No</td></tr>
                        <tr><td>Volumen Contraste (ml)</td><td>Solo TAC contrastado: 30 – 200 ml</td><td className="text-center text-muted">Solo TAC+SI</td></tr>
                      </tbody>
                    </table>
                  </div>
                </Step>
                <Step n="4">
                  Complete los <strong>Parámetros Técnicos</strong>:
                  <div className="table-responsive mt-2">
                    <table className="table table-sm table-bordered small">
                      <thead className="table-light">
                        <tr><th>Campo</th><th>Rango válido</th><th>Obligatorio</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>N° Tomas</td><td>Número entero ≥ 1</td><td className="text-center text-danger fw-bold">Sí</td></tr>
                        <tr><td>KV</td><td>40 – 200</td><td className="text-center text-danger fw-bold">Sí</td></tr>
                        <tr><td>mAs</td><td>1.2 – 500</td><td className="text-center text-danger fw-bold">Sí</td></tr>
                        <tr><td>Tecnólogo</td><td>—</td><td className="text-center text-muted">No (se prelleena automáticamente)</td></tr>
                        <tr><td>Reporte</td><td>—</td><td className="text-center text-muted">No (deshabilitado al crear)</td></tr>
                        <tr><td>Observaciones Tecnólogo</td><td>Texto libre</td><td className="text-center text-muted">No</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <Tip>
                    Los campos KV y mAs se validan automáticamente. Si el valor está fuera de rango,
                    el sistema lo marcará en rojo y no permitirá guardar hasta que se corrija.
                  </Tip>
                </Step>
                <Step n="5">
                  Haga clic en <strong>Guardar</strong> <i className="fa-solid fa-floppy-disk" />.
                  Si algún campo obligatorio está vacío, aparecerá un aviso en rojo indicando cuáles
                  campos faltan y cada campo incompleto se resaltará con borde rojo.
                </Step>
                <Step n="6">
                  Si todo está correcto, el sistema lo redirige a la lista de registros y el nuevo
                  estudio aparece con estado <span className="badge bg-warning text-dark">PENDIENTE</span>.
                </Step>
                <Tip>
                  El ID del registro se genera automáticamente con el formato <code>RX-AAAA-MM-NNNNNN</code>.
                  No es necesario ingresarlo manualmente.
                </Tip>

                <h6 className="fw-bold mt-4">6.2 Editar un registro existente</h6>
                <p className="small">
                  En la lista de registros, haga clic en el ícono <i className="fa-solid fa-pen" /> del registro
                  que desea modificar. El formulario se abre pre-llenado con los datos actuales.
                  Aplican las mismas reglas de validación que al crear.
                </p>
                <Warn>
                  No se pueden editar registros con estado <span className="badge bg-secondary">ANULADO</span>.
                  El botón de edición no aparece para esos registros.
                </Warn>
                <p className="small mb-0">
                  El <strong>Administrador</strong> puede editar registros en estado LEIDO o CORREGIDO,
                  pero el sistema le pedirá obligatoriamente un <strong>Motivo de Corrección</strong>
                  antes de guardar.
                </p>
              </Sec>

              {/* 7. Radiólogo — Lectura */}
              <Sec id="radiologo" icon="fa-stethoscope" title="7. Completar la lectura radiológica (Radiólogo)">
                <p>
                  <span className="badge bg-success">RADIÓLOGO</span>{' '}
                  <span className="badge bg-danger">ADMINISTRADOR</span>{' '}
                  <small className="text-muted ms-1">— Perfiles con acceso a esta función</small>
                </p>
                <Step n="1">
                  En la lista de registros busque los estudios con estado{' '}
                  <span className="badge bg-warning text-dark">PENDIENTE</span>.
                  Puede usar el filtro de estado en la barra de búsqueda.
                </Step>
                <Step n="2">
                  Haga clic en el ícono <i className="fa-solid fa-stethoscope text-success" /> (verde)
                  del registro que va a leer. Este ícono solo aparece para registros en estado PENDIENTE.
                </Step>
                <Step n="3">
                  En la pantalla de lectura verá dos secciones:
                  <ul className="mt-1 small">
                    <li><strong>Datos del Tecnólogo (solo lectura):</strong> muestra toda la información
                    que ingresó el tecnólogo. No se puede modificar desde aquí.</li>
                    <li><strong>Lectura Radiológica:</strong> es la sección donde el radiólogo completa su informe.</li>
                  </ul>
                </Step>
                <Step n="4">
                  Complete los campos de la lectura:
                  <div className="table-responsive mt-2">
                    <table className="table table-sm table-bordered small">
                      <thead className="table-light">
                        <tr><th>Campo</th><th>Descripción</th><th>Obligatorio</th></tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Rechazada</td>
                          <td>Seleccione SI si el estudio es rechazado, NO si fue leído normalmente</td>
                          <td className="text-center text-danger fw-bold">Sí</td>
                        </tr>
                        <tr>
                          <td>Causa de Rechazo</td>
                          <td>Aparece solo si Rechazada = SI. Seleccione el motivo del rechazo</td>
                          <td className="text-center text-danger fw-bold">Si rechazada</td>
                        </tr>
                        <tr>
                          <td>Radiólogo (LECTURA_RADIOLOGO)</td>
                          <td>Seleccione su nombre. Se pre-llena automáticamente si su usuario está vinculado al catálogo</td>
                          <td className="text-center text-danger fw-bold">Sí</td>
                        </tr>
                        <tr>
                          <td>Transcriptora</td>
                          <td>Persona que transcribe el informe (opcional)</td>
                          <td className="text-center text-muted">No</td>
                        </tr>
                        <tr>
                          <td>OBSERVACION_RADIOLOGO</td>
                          <td>Texto completo del informe radiológico. Escriba aquí el resultado del estudio</td>
                          <td className="text-center text-muted">No (recomendado)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Step>
                <Step n="5">
                  Haga clic en <strong>Guardar Lectura</strong>. El registro pasará a estado{' '}
                  <span className="badge bg-success">LEIDO</span> y ya no aparecerá en la cola de pendientes.
                </Step>
                <Tip>
                  Si su nombre de usuario coincide con un radiólogo en el catálogo, el campo
                  "Radiólogo" se selecciona automáticamente al abrir el formulario de lectura.
                </Tip>
              </Sec>

              {/* 8. Lista y búsqueda */}
              <Sec id="lista" icon="fa-list-ul" title="8. Lista de registros y búsqueda">
                <p>
                  La pantalla principal muestra todos los registros en una tabla paginada.
                  Todos los perfiles tienen acceso a esta pantalla.
                </p>
                <h6 className="fw-bold">Columnas de la tabla</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-sm table-bordered small">
                    <thead className="table-light">
                      <tr><th>Columna</th><th>Descripción</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>ID Registro</td><td>Código único generado automáticamente (ej. RX-2025-01-000001)</td></tr>
                      <tr><td>Tipo</td><td>RX / TAC / ECO con color identificador</td></tr>
                      <tr><td>Fecha Toma</td><td>Fecha y hora en que se realizó el estudio</td></tr>
                      <tr><td>Identificación</td><td>Documento del paciente</td></tr>
                      <tr><td>Paciente</td><td>Nombre completo del paciente</td></tr>
                      <tr><td>Estudio</td><td>Nombre del estudio realizado</td></tr>
                      <tr><td>Reporte</td><td>Estado de carga del reporte: POR CARGAR / CARGADO</td></tr>
                      <tr><td>Lectura</td><td>Estado del registro (PENDIENTE, LEIDO, etc.) y si fue RECHAZADA</td></tr>
                      <tr><td>Acciones</td><td>Botones: Ver detalle, Editar, Completar lectura</td></tr>
                    </tbody>
                  </table>
                </div>
                <h6 className="fw-bold">Filtros de búsqueda</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered small">
                    <thead className="table-light">
                      <tr><th>Filtro</th><th>Descripción</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Fecha Desde / Hasta</td><td>Filtra por rango de fechas de la orden</td></tr>
                      <tr><td>Tipo</td><td>Filtra solo RX, TAC o ECO</td></tr>
                      <tr><td>Estado</td><td>Filtra por estado del registro (PENDIENTE, LEIDO, etc.)</td></tr>
                      <tr><td>Identificación</td><td>Busca por número de documento del paciente</td></tr>
                      <tr><td>Nombre paciente</td><td>Busca por nombre (acepta texto parcial)</td></tr>
                    </tbody>
                  </table>
                </div>
                <Tip>
                  El botón <i className="fa-solid fa-xmark" /> (X) a la derecha de los filtros
                  limpia todos los filtros y muestra todos los registros.
                  La lista se actualiza automáticamente al cambiar cualquier filtro.
                </Tip>
                <p className="small mb-0">
                  Cuando hay muchos registros, aparece la <strong>paginación</strong> en la parte inferior.
                  Use los botones ‹ y › para navegar entre páginas.
                </p>
              </Sec>

              {/* 9. Exportar */}
              <Sec id="exportar" icon="fa-file-export" title="9. Exportar datos (Excel / TXT)">
                <p>
                  Todos los perfiles pueden exportar los registros visibles según los filtros activos.
                </p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card border-success h-100">
                      <div className="card-header bg-success text-white py-1 fw-semibold small">
                        <i className="fa-solid fa-file-excel me-1" />Exportar a Excel
                      </div>
                      <div className="card-body small">
                        <p>Genera un archivo <code>.xlsx</code> con los registros filtrados.</p>
                        <p className="mb-0">Haga clic en el botón <strong>Excel</strong> (verde) en la parte
                        superior de la lista. El archivo se descarga automáticamente.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-secondary h-100">
                      <div className="card-header bg-secondary text-white py-1 fw-semibold small">
                        <i className="fa-solid fa-file-lines me-1" />Exportar a TXT
                      </div>
                      <div className="card-body small">
                        <p>Genera un archivo de texto plano con separación de columnas, compatible
                        con la <strong>plantilla institucional</strong>.</p>
                        <p className="mb-0">Haga clic en el botón <strong>TXT</strong> en la parte
                        superior de la lista. El archivo se descarga automáticamente.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Tip>
                  Para exportar solo un rango de fechas o un tipo de estudio específico,
                  aplique primero los filtros en la lista y luego exporte. El archivo
                  incluirá únicamente los registros que coincidan con los filtros activos.
                </Tip>
                <p className="small mb-0">
                  Ambos archivos incluyen las <strong>25 columnas</strong> de la plantilla institucional:
                  datos del paciente, parámetros técnicos, nombres del tecnólogo, radiólogo, servicio,
                  informe radiológico y estado.
                </p>
              </Sec>

              {/* 10. Dashboard */}
              <Sec id="dashboard" icon="fa-chart-pie" title="10. Dashboard y estadísticas">
                <p>
                  <span className="badge bg-danger">ADMINISTRADOR</span>{' '}
                  <span className="badge bg-secondary">CONSULTA / GERENCIA</span>{' '}
                  <small className="text-muted ms-1">— Perfiles con acceso a esta función</small>
                </p>
                <p>
                  El Dashboard muestra indicadores estadísticos en tiempo real.
                  Se accede desde el ícono <i className="fa-solid fa-chart-pie" /> del menú lateral.
                </p>
                <h6 className="fw-bold">Indicadores principales (KPIs)</h6>
                <div className="row g-2 mb-3">
                  {[
                    ['bg-primary', 'Total Registros', 'Todos los registros en el período seleccionado'],
                    ['bg-warning text-dark', 'Pendientes', 'Estudios aún sin leer por el radiólogo'],
                    ['bg-success', 'Leídos', 'Estudios con lectura completada'],
                    ['bg-danger', 'Rechazados', 'Estudios marcados como rechazados'],
                  ].map(([badge, kpi, desc]) => (
                    <div key={kpi} className="col-md-3 col-6">
                      <div className={`card border-0 text-center py-2 ${badge}`}>
                        <div className="fw-bold">{kpi}</div>
                        <div className="small">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <h6 className="fw-bold">Gráficas y tablas disponibles</h6>
                <ul className="small">
                  <li><strong>Distribución por tipo de estudio:</strong> dona con totales de RX, TAC y ECO.</li>
                  <li><strong>Registros por Servicio:</strong> barras con los 8 servicios con más estudios.</li>
                  <li><strong>Registros por Estudio:</strong> barras con los 10 estudios más frecuentes.</li>
                  <li><strong>Productividad por Tecnólogo:</strong> tabla con total de estudios por tecnólogo.</li>
                  <li><strong>Productividad por Radiólogo:</strong> tabla con total de lecturas por radiólogo.</li>
                </ul>
                <Tip>
                  Use los filtros de fecha en la parte superior del Dashboard para ver estadísticas
                  de un período específico (semana, mes, año, etc.).
                </Tip>
              </Sec>

              {/* 11. Catálogos */}
              <Sec id="catalogos" icon="fa-book" title="11. Catálogos (solo Administrador)">
                <p>
                  <span className="badge bg-danger">ADMINISTRADOR</span>{' '}
                  <small className="text-muted ms-1">— Único perfil con acceso</small>
                </p>
                <p>
                  Los catálogos son las tablas maestras de las que se alimentan los selectores del formulario.
                  Se accede desde el ícono <i className="fa-solid fa-book" /> del menú lateral.
                </p>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered small">
                    <thead className="table-dark">
                      <tr><th>Catálogo</th><th>¿Para qué sirve?</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Estudios</td><td>Lista de estudios disponibles por tipo (RX, TAC, ECO)</td></tr>
                      <tr><td>Servicios</td><td>Servicios hospitalarios de origen del paciente</td></tr>
                      <tr><td>Profesionales</td><td>Médicos que pueden ordenar estudios</td></tr>
                      <tr><td>Radiólogos</td><td>Radiólogos que leen los estudios</td></tr>
                      <tr><td>Tecnólogos</td><td>Tecnólogos que realizan los estudios</td></tr>
                      <tr><td>Transcriptoras</td><td>Personal que transcribe los informes</td></tr>
                      <tr><td>Reportes</td><td>Tipos de reporte o plantilla institucional</td></tr>
                      <tr><td>Causas de Rechazo</td><td>Motivos válidos para rechazar un estudio</td></tr>
                      <tr><td>Especialidades</td><td>Especialidades médicas (para profesionales)</td></tr>
                    </tbody>
                  </table>
                </div>
                <h6 className="fw-bold">Acciones disponibles en cada catálogo</h6>
                <ul className="small">
                  <li><strong>Agregar:</strong> use el botón <span className="badge bg-primary">+ Nuevo</span> para crear un registro nuevo.</li>
                  <li><strong>Editar:</strong> haga clic en el ícono <i className="fa-solid fa-pen" /> del registro que desea modificar.</li>
                  <li><strong>Activar / Inactivar:</strong> los registros inactivos no aparecen en los selectores del formulario.
                    Use el toggle o botón de estado para cambiar la disponibilidad sin eliminar el registro.</li>
                </ul>
                <Warn>
                  No elimine catálogos que ya estén usados en registros existentes, ya que esto
                  puede afectar la integridad de los datos históricos. Use la opción Inactivar en su lugar.
                </Warn>
              </Sec>

              {/* 12. Usuarios */}
              <Sec id="usuarios" icon="fa-user-gear" title="12. Gestión de usuarios (solo Administrador)">
                <p>
                  <span className="badge bg-danger">ADMINISTRADOR</span>{' '}
                  <small className="text-muted ms-1">— Único perfil con acceso</small>
                </p>
                <p>
                  Desde el menú <i className="fa-solid fa-users-gear" /> <strong>Usuarios</strong> el administrador
                  puede crear y gestionar las cuentas de acceso al sistema.
                </p>
                <h6 className="fw-bold">Crear un usuario nuevo</h6>
                <Step n="1">Haga clic en <span className="badge bg-primary">+ Nuevo Usuario</span>.</Step>
                <Step n="2">
                  Complete los datos del usuario:
                  <ul className="mt-1 small">
                    <li><strong>Nombre completo:</strong> nombre real del usuario.</li>
                    <li><strong>Usuario de login:</strong> identificador único para iniciar sesión (sin espacios).</li>
                    <li><strong>Contraseña:</strong> contraseña inicial (el usuario puede cambiarla luego).</li>
                    <li><strong>Rol:</strong> perfil del usuario (ADMINISTRADOR, TECNOLOGO, RADIOLOGO o CONSULTA/GERENCIA).</li>
                  </ul>
                </Step>
                <Step n="3">Haga clic en <strong>Guardar</strong>. El usuario ya puede iniciar sesión.</Step>

                <h6 className="fw-bold mt-3">Activar o inactivar un usuario</h6>
                <p className="small mb-0">
                  En la lista de usuarios, use el botón de estado para activar o inactivar una cuenta.
                  Un usuario inactivo no puede iniciar sesión pero sus datos históricos se conservan.
                </p>
                <Warn>
                  Si un tecnólogo o radiólogo va a ser reemplazado, inactívelo en lugar de eliminarlo.
                  Sus registros históricos quedarán correctamente referenciados.
                </Warn>

                <h6 className="fw-bold mt-3">Vinculación con catálogos</h6>
                <p className="small mb-0">
                  Para que el sistema pre-llene automáticamente el campo "Tecnólogo" al crear un registro,
                  o "Radiólogo" al completar una lectura, el <strong>nombre completo</strong> del usuario
                  debe coincidir exactamente con el nombre registrado en el catálogo de Tecnólogos o Radiólogos.
                </p>
              </Sec>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          nav, .cmva-navbar, .cmva-sidebar, .d-print-none, button, .btn { display: none !important; }
          #manual-content { font-size: 11pt; }
          .col-lg-9 { width: 100% !important; flex: 0 0 100% !important; max-width: 100% !important; }
          .card { border: 1px solid #ddd !important; }
          a { color: inherit !important; text-decoration: none !important; }
          section { page-break-inside: avoid; }
        }
      `}</style>
    </>
  )
}
