import os
import httpx

OPERACION_URL = os.getenv("OPERACION_URL", "http://ms-operacion:8000")
TIMEOUT_SECONDS = 5.0


class IntegracionesClient:
    """Llamadas HTTP a Operación para validar el viaje y resolver el monto base de su ruta."""

    async def obtener_viaje(self, viaje_id: int, auth_header: str | None) -> dict | None:
        headers = {"Authorization": auth_header} if auth_header else {}
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            resp = await client.get(f"{OPERACION_URL}/api/v1/operacion/viajes/{viaje_id}", headers=headers)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()

    async def obtener_ruta(self, ruta_id: int, auth_header: str | None) -> dict | None:
        headers = {"Authorization": auth_header} if auth_header else {}
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            resp = await client.get(f"{OPERACION_URL}/api/v1/operacion/rutas/{ruta_id}", headers=headers)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
