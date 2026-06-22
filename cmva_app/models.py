from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import pytz
from datetime import datetime


def _now_col():
    """Hora actual en zona Colombia (UTC-5), sin tzinfo para SQLite."""
    return datetime.now(pytz.timezone("America/Bogota")).replace(tzinfo=None)


class Rol(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(60), unique=True, nullable=False)
    descripcion = Column(String(200))
    estado = Column(Boolean, default=True)
    usuarios = relationship("Usuario", back_populates="rol")


class Especialidad(Base):
    __tablename__ = "especialidades"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), unique=True, nullable=False)
    descripcion = Column(String(200))
    estado = Column(Boolean, default=True)
    estudios = relationship("Estudio", back_populates="especialidad")
    radiologos = relationship("Radiologo", back_populates="especialidad")


class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    tipo_documento = Column(String(20))
    numero_documento = Column(String(30))
    nombre_completo = Column(String(200), nullable=False)
    usuario = Column(String(50), unique=True, nullable=False)
    correo = Column(String(100))
    password_hash = Column(String(255), nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    especialidad_id = Column(Integer, ForeignKey("especialidades.id"), nullable=True)
    estado = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_now_col)
    updated_at = Column(DateTime, default=_now_col, onupdate=_now_col)

    rol = relationship("Rol", back_populates="usuarios")
    especialidad = relationship("Especialidad")
    tecnologo_perfil = relationship("Tecnologo", back_populates="usuario", uselist=False)
    radiologo_perfil = relationship("Radiologo", back_populates="usuario", uselist=False)
    transcriptora_perfil = relationship("Transcriptora", back_populates="usuario", uselist=False)


class Estudio(Base):
    __tablename__ = "estudios"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20))
    nombre = Column(String(150), nullable=False)
    tipo = Column(String(10), nullable=True)   # RX, TAC, ECO
    especialidad_id = Column(Integer, ForeignKey("especialidades.id"), nullable=True)
    estado = Column(Boolean, default=True)
    especialidad = relationship("Especialidad", back_populates="estudios")


class Servicio(Base):
    __tablename__ = "servicios"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20))
    nombre = Column(String(100), nullable=False)
    estado = Column(Boolean, default=True)


class CausaRechazo(Base):
    __tablename__ = "causas_rechazo"
    id = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String(200), nullable=False)
    estado = Column(Boolean, default=True)


class Tecnologo(Base):
    __tablename__ = "tecnologos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, unique=True)
    estado = Column(Boolean, default=True)
    usuario = relationship("Usuario", back_populates="tecnologo_perfil")


class Radiologo(Base):
    __tablename__ = "radiologos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    especialidad_id = Column(Integer, ForeignKey("especialidades.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, unique=True)
    estado = Column(Boolean, default=True)
    especialidad = relationship("Especialidad", back_populates="radiologos")
    usuario = relationship("Usuario", back_populates="radiologo_perfil")


class Transcriptora(Base):
    __tablename__ = "transcriptoras"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, unique=True)
    estado = Column(Boolean, default=True)
    usuario = relationship("Usuario", back_populates="transcriptora_perfil")


class Reporte(Base):
    __tablename__ = "reportes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    estado = Column(Boolean, default=True)


class Profesional(Base):
    __tablename__ = "profesionales"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    tipo = Column(String(50), default="MEDICO GENERAL")  # MEDICO GENERAL, ESPECIALISTA
    estado = Column(Boolean, default=True)


class RegistroRayosX(Base):
    __tablename__ = "registros_rayos_x"
    id = Column(Integer, primary_key=True, index=True)
    codigo_registro = Column(String(30), unique=True, nullable=False, index=True)
    tipo_estudio_principal = Column(String(10), nullable=False, default='RX')  # RX, TAC, ECO
    # Bloque Tecnologo
    fecha_hora_toma = Column(DateTime, nullable=False)
    fecha_hora_orden = Column(DateTime, nullable=False)
    identificacion = Column(String(30), nullable=False)
    nombre_paciente = Column(String(200), nullable=False)
    contrastado_si_no = Column(String(2), nullable=False, default='NO')
    estudio_id = Column(Integer, ForeignKey("estudios.id"), nullable=False)
    codigo_tac = Column(String(50), nullable=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False)
    profesional_id = Column(Integer, ForeignKey("profesionales.id"), nullable=True)
    numero_tomas = Column(Integer, nullable=False)
    kv = Column(Float, nullable=False)
    mas = Column(Float, nullable=False)
    volumen_contraste_ml = Column(Float, nullable=True)
    observaciones_tecnologo = Column(Text, nullable=True)
    rechazada = Column(Boolean, default=False, nullable=False)
    causa_rechazo_id = Column(Integer, ForeignKey("causas_rechazo.id"), nullable=True)
    tecnologo_id = Column(Integer, ForeignKey("tecnologos.id"), nullable=True)
    reporte_id = Column(Integer, ForeignKey("reportes.id"), nullable=True)
    # Bloque Radiologo
    fecha_hora_lectura_radiologo = Column(DateTime, nullable=True)
    lectura_radiologo = Column(Text, nullable=True)
    radiologo_id = Column(Integer, ForeignKey("radiologos.id"), nullable=True)
    transcriptora_id = Column(Integer, ForeignKey("transcriptoras.id"), nullable=True)
    observaciones_radiologo = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)  # columna legado, no usar en nuevos registros
    # Estado y trazabilidad
    estado_carga = Column(String(30), nullable=True)
    estado = Column(String(30), default="PENDIENTE", nullable=False)
    creado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    modificado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    leido_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    motivo_anulacion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now_col)
    updated_at = Column(DateTime, default=_now_col, onupdate=_now_col)

    estudio = relationship("Estudio")
    servicio = relationship("Servicio")
    causa_rechazo = relationship("CausaRechazo")
    tecnologo = relationship("Tecnologo")
    reporte = relationship("Reporte")
    radiologo = relationship("Radiologo")
    transcriptora = relationship("Transcriptora")
    profesional = relationship("Profesional")
    creado_por = relationship("Usuario", foreign_keys=[creado_por_id])
    modificado_por = relationship("Usuario", foreign_keys=[modificado_por_id])
    leido_por = relationship("Usuario", foreign_keys=[leido_por_id])
    auditoria = relationship("AuditoriaRegistro", back_populates="registro", order_by="AuditoriaRegistro.fecha_hora")


class AuditoriaRegistro(Base):
    __tablename__ = "auditoria_registros"
    id = Column(Integer, primary_key=True, index=True)
    registro_id = Column(Integer, ForeignKey("registros_rayos_x.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    accion = Column(String(50), nullable=False)
    campo_modificado = Column(String(100), nullable=True)
    valor_anterior = Column(Text, nullable=True)
    valor_nuevo = Column(Text, nullable=True)
    fecha_hora = Column(DateTime, default=_now_col)
    ip_origen = Column(String(50), nullable=True)
    motivo_correccion = Column(Text, nullable=True)

    registro = relationship("RegistroRayosX", back_populates="auditoria")
    usuario = relationship("Usuario")
