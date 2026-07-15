#!/bin/bash
# =====================================================================
# Script para construir y ejecutar las pruebas usando Docker
# Una sola imagen (hub-empresarial-tests) sirve para todos los tipos
# de prueba, incluyendo E2E con Playwright/Chromium headless.
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
    HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || echo "000")

    if [ "$HEALTH_CODE" = "200" ]; then
        echo "[+] El entorno ya está activo y saludable. Continuando..."
    else
        echo "[*] El entorno está apagado. Levantando Docker Compose automáticamente..."
        WAS_COMPOSE_DOWN=true
        docker compose up -d
        if [ $? -ne 0 ]; then
            echo "[-] Error iniciando Docker Compose."
            exit 1
        fi

        # Bucle de espera de salud (hasta 2 minutos)
        echo "[*] Esperando a que los servicios estén listos (Health Check)..."
        RETRIES=60
        until [ $RETRIES -le 0 ]; do
            HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || echo "000")
            if [ "$HEALTH_CODE" = "200" ]; then
                echo "[+] Entorno levantado y saludable. Continuando..."
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
    docker run --rm --network host $IMAGE_NAME pytest tests/integration/
    return $?
}

run_stress_tests_headless() {
    USERS=$1
    SPAWN_RATE=$2
    DURATION=$3
    echo "[*] Ejecutando PRUEBAS DE ESTRÉS en modo HEADLESS (sin interfaz gráfica)..."
    echo "[*] Duración: $DURATION | Usuarios simulados: $USERS | Tasa de spawn: $SPAWN_RATE/seg"
    
    # Ejecutar y capturar salida a archivo temporal
    TEMP_LOG="locust_run_$(date +%s).log"
    docker run --rm --network host $IMAGE_NAME locust -f tests/stress/locustfile.py --headless -u $USERS -r $SPAWN_RATE --run-time $DURATION --host http://localhost:8080 > "$TEMP_LOG" 2>&1
    EXIT_CODE=$?
    cat "$TEMP_LOG"
    
    if [ $EXIT_CODE -eq 0 ]; then
        LAST_AGGREGATED=$(grep "Aggregated" "$TEMP_LOG" | grep "%" | tail -n 1)
        REQ_COUNT=$(echo "$LAST_AGGREGATED" | awk '{print $2}')
        FAIL_COUNT=$(echo "$LAST_AGGREGATED" | awk '{print $3}')
        FAIL_NUM=$(echo "$FAIL_COUNT" | cut -d'(' -f1)
        rm -f "$TEMP_LOG"
        
        if [ -z "$REQ_COUNT" ] || [ -z "$FAIL_NUM" ]; then
            echo -e "\n====================== Locust Stress Test: SUCCESS (0 failures) in $DURATION ======================"
        else
            PASSED_COUNT=$((REQ_COUNT - FAIL_NUM))
            echo -e "\n====================== Locust Stress Test: $PASSED_COUNT passed ($FAIL_NUM failed) in $DURATION ======================"
        fi
    else
        rm -f "$TEMP_LOG"
        echo -e "\n====================== Locust Stress Test: FAILED (Exit Code $EXIT_CODE) ======================"
        exit 1
    fi
}

run_stress_tests() {
    ensure_compose_up
    if [ "$1" = "--headless" ]; then
        run_stress_tests_headless 10 2 10s
    else
        echo "[*] Iniciando servidor de PRUEBAS DE ESTRÉS (Locust)..."
        echo "[!] Para acceder a la interfaz web, abre tu navegador en: http://localhost:8089"
        echo "[!] Presiona Ctrl+C en esta terminal para detener la prueba."
        docker run -it --rm --network host $IMAGE_NAME locust -f tests/stress/locustfile.py
    fi
    cleanup_compose
}


run_e2e_tests() {
    ensure_compose_up
    echo "[*] Ejecutando PRUEBAS E2E (Playwright/Chromium headless)..."
    # --shm-size=256m: Chromium necesita mas de los 64MB por defecto de /dev/shm para renderizar sin crashear
    docker run --rm --network host --shm-size=256m $IMAGE_NAME pytest tests/e2e/
    return $?
}

show_help() {
    echo "Uso: $0 [opcion]"
    echo "Opciones:"
    echo "  unit         Ejecuta únicamente las pruebas unitarias (no requiere Docker Compose)."
    echo "  integration  Ejecuta únicamente las pruebas de integración."
    echo "  stress       Inicia el servidor interactivo de Locust en: http://localhost:8089"
    echo "               Opcional: './run_tests.sh stress --headless' para test rápido de 10s."

    echo "  e2e          Ejecuta las pruebas E2E con Playwright/Chromium headless."
    echo "  all          Construye la imagen y ejecuta todas las pruebas consecutivamente."
    echo "  build        Solo construye la imagen de pruebas."
    echo "  help         Muestra este mensaje."
}

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
        cleanup_compose
        ;;
    stress)
        build_image
        run_stress_tests "$2"
        ;;

    e2e)
        build_image
        run_e2e_tests
        cleanup_compose
        ;;
    all)
        build_image
        run_unit_tests
        ensure_compose_up
        echo "[*] Ejecutando PRUEBAS DE INTEGRACIÓN..."
        docker run --rm --network host $IMAGE_NAME pytest tests/integration/
        echo "[*] Ejecutando PRUEBAS E2E (Playwright/Chromium headless)..."
        docker run --rm --network host --shm-size=256m $IMAGE_NAME pytest tests/e2e/
        run_stress_tests_headless 10 1 10s
        cleanup_compose
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
