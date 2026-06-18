FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements.txt desde la raíz del proyecto
COPY requirements.txt .

# Instalar dependencias de Python (esta capa se cachea)
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente y las pruebas al contenedor
COPY . .

# Comando por defecto para ejecutar toda la suite de pruebas
CMD ["pytest"]
