from pydantic import BaseModel
from datetime import datetime
from typing import Optional

PRIORIDADES_VALIDAS = {"baja", "media", "alta"}
ESTADOS_VALIDOS = {"pendiente", "en_proceso", "resuelta", "rechazada"}


class SolicitudCreate(BaseModel):
    modulo_origen: str
    modulo_destino: str
    titulo: str
    mensaje: str
    prioridad: str = "media"


class SolicitudUpdate(BaseModel):
    """Schema para actualizar estado/respuesta de una solicitud."""
    estado: Optional[str] = None
    respuesta: Optional[str] = None


class SolicitudResponse(BaseModel):
    id: int
    modulo_origen: str
    modulo_destino: str
    titulo: str
    mensaje: str
    prioridad: str
    estado: str
    creado_por_id: str
    creado_por_nombre: Optional[str] = None
    respuesta: Optional[str] = None
    created_at: datetime
    resuelto_at: Optional[datetime] = None

    class Config:
        from_attributes = True
