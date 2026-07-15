from src.models.rendicion_db import RendicionDB
from src.repository.rendicion_repository import RendicionRepository
from src.service.integraciones_client import IntegracionesClient


class RendicionService:
    def __init__(self, repository: RendicionRepository, integraciones: IntegracionesClient | None = None):
        self.repository = repository
        self.integraciones = integraciones or IntegracionesClient()

    async def crear_rendicion(self, data: dict, auth_header: str | None) -> RendicionDB:
        # Solo se puede rendir un viaje que exista y tenga conductor asignado —
        # eso es justamente la prueba de que "el conductor tiene un viaje".
        viaje = await self.integraciones.obtener_viaje(data["viaje_id"], auth_header)
        if not viaje:
            raise ValueError("El viaje indicado no existe")
        if not viaje.get("conductor_id"):
            raise ValueError("El viaje no tiene conductor asignado")

        ruta_id = viaje.get("ruta_id")
        monto_base = None
        if ruta_id:
            ruta = await self.integraciones.obtener_ruta(ruta_id, auth_header)
            if ruta:
                monto_base = ruta["monto_base"]

        monto = data.get("monto")
        if monto is None:
            if monto_base is None:
                raise ValueError("Este viaje no tiene una ruta con monto preconfigurado — indique el monto manualmente")
            monto = monto_base
        elif monto_base is not None and monto < monto_base:
            raise ValueError(f"El monto no puede ser menor al monto base de la ruta (${monto_base})")

        rendicion = RendicionDB(
            viaje_id=viaje["id"],
            conductor_id=viaje["conductor_id"],
            ruta_id=ruta_id,
            monto=monto,
            comentarios=data.get("comentarios"),
            estado="Pendiente",
            creado_por_id=data["creado_por_id"],
            creado_por_nombre=data.get("creado_por_nombre"),
        )
        return await self.repository.save(rendicion)

    async def obtener_todos(self, viaje_id: int | None = None, conductor_id: int | None = None) -> list[RendicionDB]:
        return await self.repository.find_all(viaje_id=viaje_id, conductor_id=conductor_id)

    async def obtener_por_id(self, id_val: int) -> RendicionDB | None:
        return await self.repository.find_by_id(id_val)

    async def eliminar_rendicion(self, id_val: int) -> bool:
        return await self.repository.delete(id_val)
