FROM python:3.13-slim

WORKDIR /app

# Dependencias de sistema para psycopg2-binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python (cacheado si no cambia requirements.txt)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar sólo el código de la app
COPY app/ ./app/

# Directorio para logos locales (fallback si SUPABASE_SERVICE_KEY no está configurado)
RUN mkdir -p /app/static/logos

EXPOSE 8000

# Producción: sin --reload, workers según CPUs disponibles
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
