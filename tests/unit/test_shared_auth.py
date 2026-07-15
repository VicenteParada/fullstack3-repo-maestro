import pytest
import shared_auth
from quart import g

@pytest.mark.asyncio
async def test_gateway_auth_success(client, generate_token):
    # Forzar modo Gateway
    shared_auth.TRUSTED_GATEWAY = True
    
    headers = {
        "X-User-ID": "123",
        "X-User-Role": "admin",
        "X-User-Email": "admin@asdf.cl",
        "X-User-Permisos": '{"bodega": "edit"}'
    }
    
    response = await client.get('/test-login-required', headers=headers)
    assert response.status_code == 200
    
    data = await response.get_json()
    assert data["message"] == "success"
    assert data["user_id"] == "123"

@pytest.mark.asyncio
async def test_gateway_auth_missing_headers(client):
    # Forzar modo Gateway
    shared_auth.TRUSTED_GATEWAY = True
    
    # Sin cabeceras de Nginx
    response = await client.get('/test-login-required')
    assert response.status_code == 401
    
    data = await response.get_json()
    assert "error" in data
    assert "Headers de gateway ausentes" in data["error"]

@pytest.mark.asyncio
async def test_standalone_auth_success(client, generate_token):
    # Forzar modo Standalone (decodificar JWT localmente)
    shared_auth.TRUSTED_GATEWAY = False
    
    token = generate_token(sub="456", email="user@asdf.cl", rol="user")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = await client.get('/test-login-required', headers=headers)
    assert response.status_code == 200
    
    data = await response.get_json()
    assert data["message"] == "success"
    assert data["user_id"] == "456"

@pytest.mark.asyncio
async def test_standalone_auth_expired_token(client, generate_token):
    shared_auth.TRUSTED_GATEWAY = False
    
    token = generate_token(expired=True)
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = await client.get('/test-login-required', headers=headers)
    assert response.status_code == 401
    
    data = await response.get_json()
    assert "error" in data
    assert "expirado" in data["error"].lower()

@pytest.mark.asyncio
async def test_standalone_auth_invalid_token(client):
    shared_auth.TRUSTED_GATEWAY = False
    
    headers = {
        "Authorization": "Bearer token-invalido-123"
    }
    
    response = await client.get('/test-login-required', headers=headers)
    assert response.status_code == 401
    
    data = await response.get_json()
    assert "error" in data
    assert "inválido" in data["error"].lower()

@pytest.mark.asyncio
async def test_require_permission_view_success(client, generate_token):
    # Modo Standalone
    shared_auth.TRUSTED_GATEWAY = False
    
    token = generate_token(permisos={"bodega": "view"})
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = await client.get('/test-permission-view', headers=headers)
    assert response.status_code == 200
    
    data = await response.get_json()
    assert data["message"] == "has view permission"

@pytest.mark.asyncio
async def test_require_permission_edit_insufficient(client, generate_token):
    # Modo Standalone, tiene view pero requiere edit
    shared_auth.TRUSTED_GATEWAY = False
    
    token = generate_token(permisos={"bodega": "view"})
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = await client.get('/test-permission-edit', headers=headers)
    assert response.status_code == 403
    
    data = await response.get_json()
    assert "error" in data
    assert "Permisos insuficientes" in data["error"]

@pytest.mark.asyncio
async def test_require_permission_edit_success(client, generate_token):
    # Modo Standalone, tiene edit y requiere edit
    shared_auth.TRUSTED_GATEWAY = False
    
    token = generate_token(permisos={"bodega": "edit"})
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = await client.get('/test-permission-edit', headers=headers)
    assert response.status_code == 200
    
    data = await response.get_json()
    assert data["message"] == "has edit permission"
