from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text
from datetime import datetime


class Base(DeclarativeBase):
    pass


class SolicitudDB(Base):
    __tablename__ = "solicitudes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    modulo_origen: Mapped[str] = mapped_column(String(50))
    modulo_destino: Mapped[str] = mapped_column(String(50))
    titulo: Mapped[str] = mapped_column(String(150))
    mensaje: Mapped[str] = mapped_column(Text)
    prioridad: Mapped[str] = mapped_column(String(20), default="media")
    estado: Mapped[str] = mapped_column(String(20), default="pendiente")
    creado_por_id: Mapped[str] = mapped_column(String(100))
    creado_por_nombre: Mapped[str | None] = mapped_column(String(150), nullable=True)
    respuesta: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    resuelto_at: Mapped[datetime | None] = mapped_column(nullable=True)
