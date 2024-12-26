from app.main import app  # Importa tu instancia de FastAPI desde app/main.py

# Verifica que Vercel entienda que esta es una aplicación ASGI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
