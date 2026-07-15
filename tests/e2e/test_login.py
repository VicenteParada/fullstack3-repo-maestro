import os
import pytest
import requests

BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:8080")

# =====================================================================
# Pruebas E2E de flujo completo de autenticación y acceso a la API
#
# Estas pruebas validan el flujo real end-to-end:
#   1. Login → obtención de JWT
#   2. Acceso a rutas protegidas con token válido
#   3. Rechazo de rutas protegidas sin token
#   4. Acceso a rutas públicas
#
# No dependen del front-end (React/Vite), prueban directamente la API
# a través del gateway de Nginx en el puerto 8080.
# =====================================================================


class TestFlujoAutenticacion:
    """Prueba el flujo completo de autenticación vía API Gateway."""

    def test_01_gateway_disponible(self):
        """El gateway debe responder en el endpoint de salud."""
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        assert response.status_code == 200, (
            f"El gateway no responde: HTTP {response.status_code}"
        )

    def test_02_login_exitoso_admin(self):
        """Un usuario administrador puede autenticarse y obtener un token JWT."""
        payload = {"email": "admin@asdf.cl", "password": "admin123"}
        response = requests.post(
            f"{BASE_URL}/api/v1/administracion/login",
            json=payload,
            timeout=10,
        )
        assert response.status_code == 200, (
            f"Login fallido: HTTP {response.status_code} — {response.text}"
        )
        data = response.json()
        assert "user" in data and "token" in data["user"], (
            f"Respuesta no contiene token: {data}"
        )
        assert len(data["user"]["token"]) > 20, "El token JWT parece inválido (muy corto)"

    def test_03_login_credenciales_invalidas(self):
        """Credenciales incorrectas deben ser rechazadas con 401."""
        payload = {"email": "noexiste@asdf.cl", "password": "wrongpassword"}
        response = requests.post(
            f"{BASE_URL}/api/v1/administracion/login",
            json=payload,
            timeout=10,
        )
        assert response.status_code in (401, 403, 404), (
            f"Se esperaba rechazo de credenciales inválidas, pero se obtuvo: "
            f"HTTP {response.status_code}"
        )

    def test_04_ruta_protegida_sin_token(self):
        """Acceder a una ruta protegida sin token debe retornar 401 o 403."""
        response = requests.get(
            f"{BASE_URL}/api/v1/administracion/usuarios",
            timeout=10,
        )
        assert response.status_code in (401, 403), (
            f"Se esperaba rechazo sin token, pero se obtuvo: HTTP {response.status_code}"
        )

    def test_05_flujo_completo_login_y_acceso(self):
        """Flujo E2E: login → obtener token → usar token en ruta protegida."""
        # Paso 1: Login
        login_response = requests.post(
            f"{BASE_URL}/api/v1/administracion/login",
            json={"email": "admin@asdf.cl", "password": "admin123"},
            timeout=10,
        )
        assert login_response.status_code == 200, (
            f"Login fallido en flujo completo: {login_response.text}"
        )
        token = login_response.json().get("user", {}).get("token")
        assert token, "No se obtuvo token en el login"

        # Paso 2: Usar el token en una ruta protegida
        headers = {"Authorization": f"Bearer {token}"}
        protected_response = requests.get(
            f"{BASE_URL}/api/v1/administracion/usuarios",
            headers=headers,
            timeout=10,
        )
        # Con token válido debe responder 200 (o 404 si la ruta no existe, pero no 401/403)
        assert protected_response.status_code not in (401, 403), (
            f"El token válido fue rechazado: HTTP {protected_response.status_code}"
        )
