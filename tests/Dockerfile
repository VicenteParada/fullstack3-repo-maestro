FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias (incluye las de Playwright/Chromium)
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    # Dependencias para Playwright / Chromium headless
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements.txt desde la raíz del proyecto
COPY requirements.txt .

# Instalar dependencias de Python (esta capa se cachea)
RUN pip install --no-cache-dir -r requirements.txt

# Instalar binarios de Chromium para Playwright
RUN playwright install chromium

# Copiar el código fuente y las pruebas al contenedor
COPY . .

# Comando por defecto para ejecutar toda la suite de pruebas
CMD ["pytest"]
