#!/bin/bash
# =====================================================================
# Script interactivo de despliegue en Kubernetes (AWS EKS & Local K3s)
# =====================================================================

show_menu() {
    clear
    echo "====================================================================="
    echo "          SELECTOR DE DESPLIEGUE - MAESTRO KUBERNETES"
    echo "====================================================================="
    echo "  1) Desplegar en AWS (EKS - Universidad / Produccion)"
    echo "  2) Desplegar en Local (K3s/Minikube - Trabajo / Desarrollo)"
    echo "  3) Eliminar despliegue AWS"
    echo "  4) Eliminar despliegue Local"
    echo "  5) Salir"
    echo "====================================================================="
    echo ""
    read -p "Selecciona una opcion [1-5]: " opcion
}

deploy_aws() {
    echo ""
    echo "====================================================================="
    echo "  [PROCESO] Iniciando despliegue en AWS (EKS)"
    echo "====================================================================="
    echo "1. Asegurate de tener configurado tu AWS CLI y kubectl apuntando a tu EKS."
    echo "2. Asegurate de haber subido las imagenes a tu registro ECR."
    echo ""
    # Opcional: kubectl config use-context mi-contexto-aws
    helm upgrade --install modular-app ./kubernetes/helm/modular-app -f ./kubernetes/helm/modular-app/values-aws.yaml
    if [ $? -eq 0 ]; then
        echo -e "\n\e[32m[OK] Despliegue en AWS completado exitosamente.\e[0m"
    else
        echo -e "\n\e[31m[ERROR] El despliegue de Helm ha fallado.\e[0m"
    fi
    read -p "Presiona Enter para continuar..."
}

deploy_local() {
    echo ""
    echo "====================================================================="
    echo "  [PROCESO] Iniciando despliegue en Kubernetes Local (K3s/Minikube)"
    echo "====================================================================="
    echo ""
    echo "[*] IMPORTANTE: Construyendo imagen local de Postgres con pg_cron si no existe..."
    docker build -t db-postgres:local ./db_postgres
    echo ""
    # Opcional: kubectl config use-context default
    helm upgrade --install modular-app ./kubernetes/helm/modular-app -f ./kubernetes/helm/modular-app/values-local.yaml
    if [ $? -eq 0 ]; then
        echo -e "\n\e[32m[OK] Despliegue local completado exitosamente.\e[0m"
    else
        echo -e "\n\e[31m[ERROR] El despliegue local de Helm ha fallado.\e[0m"
    fi
    read -p "Presiona Enter para continuar..."
}

delete_aws() {
    echo ""
    echo "====================================================================="
    echo "  [PROCESO] Eliminando despliegue de AWS (EKS)"
    echo "====================================================================="
    helm uninstall modular-app
    read -p "Presiona Enter para continuar..."
}

delete_local() {
    echo ""
    echo "====================================================================="
    echo "  [PROCESO] Eliminando despliegue Local (K3s/Minikube)"
    echo "====================================================================="
    helm uninstall modular-app
    read -p "Presiona Enter para continuar..."
}

while true; do
    show_menu
    case $opcion in
        1) deploy_aws ;;
        2) deploy_local ;;
        3) delete_aws ;;
        4) delete_local ;;
        5) echo -e "\nSaliendo del selector. Buen dia!"; exit 0 ;;
        *) echo -e "\n\e[31m[ERROR] Opcion invalida.\e[0m"; sleep 1.5 ;;
    esac
done
