from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from src.models.rendicion_db import RendicionDB


class RendicionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, obj: RendicionDB) -> RendicionDB:
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def find_all(self, viaje_id: int | None = None, conductor_id: int | None = None) -> list[RendicionDB]:
        query = select(RendicionDB)
        if viaje_id is not None:
            query = query.where(RendicionDB.viaje_id == viaje_id)
        if conductor_id is not None:
            query = query.where(RendicionDB.conductor_id == conductor_id)
        result = await self.session.execute(query.order_by(RendicionDB.created_at.desc()))
        return list(result.scalars().all())

    async def find_by_id(self, id_val: int) -> RendicionDB | None:
        result = await self.session.execute(
            select(RendicionDB).where(RendicionDB.id == id_val)
        )
        return result.scalar_one_or_none()

    async def delete(self, id_val: int) -> bool:
        result = await self.session.execute(
            delete(RendicionDB).where(RendicionDB.id == id_val)
        )
        await self.session.commit()
        return result.rowcount > 0
