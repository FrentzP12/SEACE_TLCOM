# Usar una imagen base de Python
FROM python:3.10-slim AS base

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias necesarias del sistema
RUN apt-get update && apt-get install -y gcc && apt-get clean

# Copiar los archivos del proyecto
COPY requirements.txt .

# Crear el entorno virtual e instalar dependencias
RUN python -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el resto de los archivos del proyecto
COPY . .

# Exponer el puerto para la aplicación
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
