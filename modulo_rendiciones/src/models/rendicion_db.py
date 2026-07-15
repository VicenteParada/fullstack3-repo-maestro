from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text, Numeric
from datetime import datetime


class Base(DeclarativeBase):
    pass


class RendicionDB(Base):
    __tablename__ = "rendiciones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    viaje_id: Mapped[int] = mapped_column(index=True)  # Ref a Operación (viajes.id)
    conductor_id: Mapped[int] = mapped_column(index=True)  # Ref a RRHH (personal.id) — derivado del viaje
    ruta_id: Mapped[int | None] = mapped_column(nullable=True)  # Ref a Operación (rutas.id)
    monto: Mapped[float] = mapped_column(Numeric(12, 2))
    comentarios: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="Pendiente")
    creado_por_id: Mapped[str] = mapped_column(String(100))
    creado_por_nombre: Mapped[str | None] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
