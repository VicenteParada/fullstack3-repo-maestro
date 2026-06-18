import os
import pytest
from playwright.sync_api import sync_playwright

BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:8080")

def test_login_and_redirect():
    """
    Prueba E2E utilizando Playwright.
    Valida el flujo de inicio de sesión y la redirección automática al módulo de administración.
    
    Nota: Para ejecutar localmente requiere instalar:
      pip install playwright
      playwright install chromium
    """
    with sync_playwright() as p:
        # Lanzar navegador en modo headless
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # 1. Navegar a la página de login
            print(f"Navegando a {BASE_URL}/login/ ...")
            page.goto(f"{BASE_URL}/login/", timeout=15000)
            
            # 2. Verificar que el formulario de login se carga correctamente
            assert page.locator("h1:has-text('BIENVENIDO')").is_visible()
            print("Página de login cargada exitosamente.")
            
            # 3. Ingresar credenciales del administrador global
            page.fill("input[type='email']", "admin@asdf.cl")
            page.fill("input[type='password']", "admin123")
            
            # 4. Hacer clic en ingresar
            page.click("button[type='submit']")
            print("Credenciales enviadas.")
            
            # 5. Esperar la redirección a la raíz / (Administración)
            page.wait_for_url(f"{BASE_URL}/", timeout=15000)
            print("Redirección exitosa al panel de administración.")
            
            # 6. Verificar elementos del panel de administración
            assert page.locator("aside").is_visible()
            assert page.locator("h3:has-text('Usuarios y Permisos')").is_visible()
            print("Elementos del panel principal validados con éxito.")
            
        finally:
            browser.close()
