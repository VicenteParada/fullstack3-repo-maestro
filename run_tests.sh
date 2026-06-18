#!/bin/bash
# =====================================================================
# Script para construir y ejecutar las pruebas usando Docker
# =====================================================================

IMAGE_NAME="hub-empresarial-tests"
WAS_COMPOSE_DOWN=false

build_image() {
    echo "[*] Construyendo imagen Docker de pruebas..."
    docker build -t $IMAGE_NAME -f tests/Dockerfile .
    if [ $? -ne 0 ]; then
        echo "[-] Error construyendo la imagen Docker de pruebas."
        exit 1
    fi
    echo "[+] Imagen construida exitosamente."
}

ensure_compose_up() {
    echo "[*] Verificando si el entorno de Docker Compose está activo..."
    # Verificar si el gateway responde en el puerto 8080 con código 200
    HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || echo "000")
    
    if [ "$HEALTH_CODE" = "200" ]; then
        echo "[+] El entorno ya está activo y saludable. Continuando..."
    else
        echo "[*] El entorno está apagado o no responde. Levantando Docker Compose automáticamente..."
        WAS_COMPOSE_DOWN=true
        docker compose up -d
        if [ $? -ne 0 ]; then
            echo "[-] Error iniciando Docker Compose."
            exit 1
        fi
        
        # Bucle de espera de salud (Health Check Loop)
        echo "[*] Esperando a que los servicios estén listos (Health Check)..."
        RETRIES=30
        until [ $RETRIES -le 0 ]; do
            HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || echo "000")
            if [ "$HEALTH_CODE" = "200" ]; then
                echo "[+] Entorno levantado y saludable. Continuando..."
                # Dar un pequeño margen extra para el inicio completo de la base de datos
                sleep 2
                return 0
            fi
            echo "[-] Esperando servicios... ($RETRIES intentos restantes)"
            sleep 2
            RETRIES=$((RETRIES-1))
        done
        
        echo "[-] Tiempo de espera agotado. Los servicios no se iniciaron correctamente."
        exit 1
    fi
}

cleanup_compose() {
    if [ "$WAS_COMPOSE_DOWN" = "true" ]; then
        echo "[*] Apagando el entorno Docker Compose iniciado por este script..."
        docker compose down
    fi
}

run_unit_tests() {
    echo "[*] Ejecutando PRUEBAS UNITARIAS..."
    docker run --rm $IMAGE_NAME pytest tests/unit/
}

run_integration_tests() {
    ensure_compose_up
    echo "[*] Ejecutando PRUEBAS DE INTEGRACIÓN..."
    # Se utiliza --network host para poder acceder a http://localhost:8080 expuesto en la máquina local
    docker run --rm --network host $IMAGE_NAME pytest tests/integration/
    TEST_RESULT=$?
    cleanup_compose
    return $TEST_RESULT
}

run_stress_tests() {
    ensure_compose_up
    echo "[*] Iniciando servidor de PRUEBAS DE ESTRÉS (Locust)..."
    echo "[!] Para acceder a la interfaz web, abre tu navegador en: http://localhost:8089"
    echo "[!] Presiona Ctrl+C en esta terminal para detener la prueba."
    # En red host, el puerto 8089 queda expuesto directamente en el anfitrión
    docker run -it --rm --network host $IMAGE_NAME locust -f tests/stress/locustfile.py
    cleanup_compose
}

run_e2e_tests() {
    ensure_compose_up
    echo "[*] Ejecutando PRUEBAS E2E (Playwright)..."
    echo "[!] Utilizando contenedor oficial de Microsoft Playwright..."
    # Se utiliza la imagen oficial de Playwright de Microsoft para no tener que instalar navegadores locales
    docker run --rm --network host -v "$(pwd)":/app -w /app mcr.microsoft.com/playwright/python:v1.40.0-jammy bash -c "pip install -r requirements.txt && pytest tests/e2e/"
    TEST_RESULT=$?
    cleanup_compose
    return $TEST_RESULT
}

show_help() {
    echo "Uso: $0 [opcion]"
    echo "Opciones:"
    echo "  unit         Ejecuta únicamente las pruebas unitarias (no requiere Docker Compose levantado)."
    echo "  integration  Ejecuta únicamente las pruebas de integración (gestión automática de Docker Compose)."
    echo "  stress       Inicia el servidor interactivo de Locust para pruebas de carga en: http://localhost:8089"
    echo "  e2e          Ejecuta las pruebas E2E con Playwright (gestión automática de Docker Compose)."
    echo "  all          Construye la imagen y ejecuta todas las pruebas consecutivamente."
    echo "  build        Solo construye la imagen de pruebas local."
    echo "  help         Muestra este mensaje."
}

# Verificar parámetros
OPCION=$1

if [ -z "$OPCION" ]; then
    show_help
    exit 1
fi

case "$OPCION" in
    unit)
        build_image
        run_unit_tests
        ;;
    integration)
        build_image
        run_integration_tests
        ;;
    stress)
        build_image
        run_stress_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    all)
        build_image
        run_unit_tests
        run_integration_tests
        run_e2e_tests
        ;;
    build)
        build_image
        ;;
    help|-h|--help)
        show_help
        ;;
    *)
        echo "[-] Opcion no valida: $OPCION"
        show_help
        exit 1
        ;;
esac
