import os
from app.main import app  # Importa tu instancia de FastAPI desde app/main.py

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
