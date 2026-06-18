import os
import pytest
import httpx

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8080")

@pytest.fixture
def api_client():
    return httpx.Client(base_url=GATEWAY_URL, timeout=10.0)

def test_public_health_endpoints(api_client):
    # Probar endpoint de salud
    response = api_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    
    response_v1 = api_client.get("/api/v1/health")
    assert response_v1.status_code == 200
    assert response_v1.json()["status"] == "ok"

def test_login_invalid_credentials(api_client):
    # Credenciales incorrectas
    payload = {
        "email": "invalido@asdf.cl",
        "password": "wrongpassword"
    }
    response = api_client.post("/api/v1/administracion/login", json=payload)
    assert response.status_code == 401
    assert "error" in response.json()

def test_login_and_protected_access(api_client):
    # 1. Login exitoso con el usuario administrador sembrado por defecto
    payload = {
        "email": "admin@asdf.cl",
        "password": "admin123"
    }
    response = api_client.post("/api/v1/administracion/login", json=payload)
    assert response.status_code == 200
    
    login_data = response.json()
    assert "user" in login_data
    token = login_data["user"]["token"]
    assert token is not None
    
    # 2. Acceso a ruta protegida sin token (debe fallar con 401)
    response_no_token = api_client.get("/api/v1/administracion/usuarios")
    assert response_no_token.status_code == 401
    
    # 3. Acceso a ruta protegida con token válido
    headers = {"Authorization": f"Bearer {token}"}
    response_with_token = api_client.get("/api/v1/administracion/usuarios", headers=headers)
    assert response_with_token.status_code == 200
    
    users_list = response_with_token.json()
    assert isinstance(users_list, list)
    # Debe haber al menos el usuario admin devuelto
    assert len(users_list) > 0
    assert any(u["email"] == "admin@asdf.cl" for u in users_list)

def test_unauthorized_module_access(api_client):
    # 1. Login con un usuario que tiene permisos restringidos (ej. Gestor RRHH)
    # Según seeder.py: rrhh@asdf.cl / user123 tiene permisos solo para rrhh
    payload = {
        "email": "rrhh@asdf.cl",
        "password": "user123"
    }
    response = api_client.post("/api/v1/administracion/login", json=payload)
    assert response.status_code == 200
    
    token = response.json()["user"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Intentar acceder a administración (debe dar 403 por permisos insuficientes)
    response_forbidden = api_client.get("/api/v1/administracion/usuarios", headers=headers)
    assert response_forbidden.status_code == 403
    assert "Permisos insuficientes" in response_forbidden.json()["error"]
