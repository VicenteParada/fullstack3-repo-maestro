from datetime import datetime
from src.models.solicitud_db import SolicitudDB
from src.models.solicitud import PRIORIDADES_VALIDAS, ESTADOS_VALIDOS
from src.repository.solicitud_repository import SolicitudRepository

ESTADOS_FINALES = {"resuelta", "rechazada"}


class SolicitudService:
    def __init__(self, repository: SolicitudRepository):
        self.repository = repository

    async def crear_solicitud(self, data: dict) -> SolicitudDB:
        prioridad = data.get("prioridad", "media").lower()
        if prioridad not in PRIORIDADES_VALIDAS:
            raise ValueError(f"Prioridad inválida: '{prioridad}'. Válidas: {sorted(PRIORIDADES_VALIDAS)}")

        solicitud = SolicitudDB(
            modulo_origen=data["modulo_origen"],
            modulo_destino=data["modulo_destino"],
            titulo=data["titulo"],
            mensaje=data["mensaje"],
            prioridad=prioridad,
            estado="pendiente",
            creado_por_id=data["creado_por_id"],
            creado_por_nombre=data.get("creado_por_nombre"),
        )
        return await self.repository.save(solicitud)

    async def obtener_todos(self, modulo_destino: str | None = None, modulo_origen: str | None = None, estado: str | None = None) -> list[SolicitudDB]:
        return await self.repository.find_all(modulo_destino=modulo_destino, modulo_origen=modulo_origen, estado=estado)

    async def obtener_por_id(self, id_val: int) -> SolicitudDB | None:
        return await self.repository.find_by_id(id_val)

    async def actualizar_solicitud(self, id_val: int, data: dict) -> SolicitudDB | None:
        update_data = {}
        if data.get("estado") is not None:
            estado = data["estado"].lower()
            if estado not in ESTADOS_VALIDOS:
                raise ValueError(f"Estado inválido: '{estado}'. Válidos: {sorted(ESTADOS_VALIDOS)}")
            update_data["estado"] = estado
            if estado in ESTADOS_FINALES:
                update_data["resuelto_at"] = datetime.utcnow()
        if data.get("respuesta") is not None:
            update_data["respuesta"] = data["respuesta"]

        return await self.repository.update(id_val, update_data)

    async def eliminar_solicitud(self, id_val: int) -> bool:
        return await self.repository.delete(id_val)
