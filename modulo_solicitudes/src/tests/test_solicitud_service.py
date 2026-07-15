import pytest
from unittest.mock import AsyncMock
from src.service.solicitud_service import SolicitudService
from src.models.solicitud_db import SolicitudDB


@pytest.fixture
def mock_repo():
    return AsyncMock()


@pytest.fixture
def service(mock_repo):
    return SolicitudService(mock_repo)


@pytest.mark.asyncio
async def test_crear_solicitud_ok(service, mock_repo):
    mock_repo.save = AsyncMock(side_effect=lambda x: x)

    result = await service.crear_solicitud({
        "modulo_origen": "bodega",
        "modulo_destino": "mantenciones",
        "titulo": "Falta repuesto",
        "mensaje": "Se necesita filtro de aire para camión Scania",
        "prioridad": "alta",
        "creado_por_id": "1",
        "creado_por_nombre": "Vicente",
    })

    assert result.estado == "pendiente"
    assert result.modulo_origen == "bodega"
    assert result.modulo_destino == "mantenciones"
    mock_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_crear_solicitud_prioridad_invalida(service):
    with pytest.raises(ValueError):
        await service.crear_solicitud({
            "modulo_origen": "bodega",
            "modulo_destino": "mantenciones",
            "titulo": "x",
            "mensaje": "x",
            "prioridad": "urgentisima",
            "creado_por_id": "1",
        })


@pytest.mark.asyncio
async def test_actualizar_solicitud_marca_resuelto_at(service, mock_repo):
    async def fake_update(id_val, data):
        assert data["estado"] == "resuelta"
        assert "resuelto_at" in data
        return SolicitudDB(id=id_val, estado="resuelta")

    mock_repo.update = AsyncMock(side_effect=fake_update)

    result = await service.actualizar_solicitud(1, {"estado": "RESUELTA", "respuesta": "Repuesto entregado"})

    assert result.estado == "resuelta"
    mock_repo.update.assert_called_once()
