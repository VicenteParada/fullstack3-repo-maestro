import os
import sys
import pytest
import jwt
from datetime import datetime, timedelta
from quart import Quart, jsonify, g

# Añadir la raíz al sys.path para poder importar shared_auth
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import shared_auth

@pytest.fixture
def test_secret():
    return "super-secret-key-123"

@pytest.fixture
def generate_token(test_secret):
    def _generate(sub="123", email="test@asdf.cl", rol="user", permisos=None, expired=False):
        if permisos is None:
            permisos = {}
        payload = {
            "sub": str(sub),
            "email": email,
            "rol": rol,
            "permisos": permisos,
            "exp": datetime.utcnow() + (timedelta(seconds=-10) if expired else timedelta(hours=1))
        }
        return jwt.encode(payload, test_secret, algorithm="HS256")
    return _generate

@pytest.fixture
def app():
    quart_app = Quart(__name__)
    quart_app.config['TESTING'] = True
    quart_app.config['JWT_SECRET'] = "super-secret-key-123"
    
    # Endpoints de prueba para los decoradores
    @quart_app.route('/test-login-required')
    @shared_auth.login_required
    async def test_login():
        return jsonify({"message": "success", "user_id": g.user_id})

    @quart_app.route('/test-permission-view')
    @shared_auth.login_required
    @shared_auth.require_permission('bodega', 'view')
    async def test_perm_view():
        return jsonify({"message": "has view permission"})

    @quart_app.route('/test-permission-edit')
    @shared_auth.login_required
    @shared_auth.require_permission('bodega', 'edit')
    async def test_perm_edit():
        return jsonify({"message": "has edit permission"})

    return quart_app

@pytest.fixture
def client(app):
    return app.test_client()
