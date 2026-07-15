from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RendicionCreate(BaseModel):
    viaje_id: int
    # Si no se indica, se usa el monto_base de la ruta del viaje. Si se indica,
    # no puede ser menor al monto base (es "aumentable", no reducible).
    monto: Optional[float] = None
    comentarios: Optional[str] = None


class RendicionResponse(BaseModel):
    id: int
    viaje_id: int
    conductor_id: int
    ruta_id: Optional[int] = None
    monto: float
    comentarios: Optional[str] = None
    estado: str
    creado_por_id: str
    creado_por_nombre: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
