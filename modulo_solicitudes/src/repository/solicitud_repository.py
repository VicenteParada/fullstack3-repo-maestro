from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from src.models.solicitud_db import SolicitudDB


class SolicitudRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, obj: SolicitudDB) -> SolicitudDB:
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def find_all(self, modulo_destino: str | None = None, modulo_origen: str | None = None, estado: str | None = None) -> list[SolicitudDB]:
        query = select(SolicitudDB)
        if modulo_destino is not None:
            query = query.where(SolicitudDB.modulo_destino == modulo_destino)
        if modulo_origen is not None:
            query = query.where(SolicitudDB.modulo_origen == modulo_origen)
        if estado is not None:
            query = query.where(SolicitudDB.estado == estado)
        result = await self.session.execute(query.order_by(SolicitudDB.created_at.desc()))
        return list(result.scalars().all())

    async def find_by_id(self, id_val: int) -> SolicitudDB | None:
        result = await self.session.execute(
            select(SolicitudDB).where(SolicitudDB.id == id_val)
        )
        return result.scalar_one_or_none()

    async def update(self, id_val: int, data: dict) -> SolicitudDB | None:
        update_data = {k: v for k, v in data.items() if v is not None}
        if not update_data:
            return await self.find_by_id(id_val)

        await self.session.execute(
            update(SolicitudDB).where(SolicitudDB.id == id_val).values(**update_data)
        )
        await self.session.commit()
        return await self.find_by_id(id_val)

    async def delete(self, id_val: int) -> bool:
        result = await self.session.execute(
            delete(SolicitudDB).where(SolicitudDB.id == id_val)
        )
        await self.session.commit()
        return result.rowcount > 0
