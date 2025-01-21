import asyncpg
from fastapi import FastAPI, Query
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    app.state.db = await asyncpg.create_pool(
        dsn = "postgresql://neondb_owner:VbdvNRPr2au7@ep-shrill-wind-a43e78up-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )
    yield
    # Shutdown logic
    await app.state.db.close()

app = FastAPI(lifespan=lifespan)

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Montar el directorio de frontend como archivos estáticos
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    with open("frontend/index.html") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

# Resto de endpoints
@app.get("/buscar_items")
async def buscar_items(
    p_descripcion: str = Query(None, description="Descripción del item"),
    p_departamento: str = Query(None, description="Departamento"),
    p_comprador: str = Query(None, description="Nombre del comprador"),
    p_fecha_inicio: str = Query(None, description="Fecha de inicio en formato YYYY-MM-DD"),
    p_fecha_fin: str = Query(None, description="Fecha de fin en formato YYYY-MM-DD")
):
    """
    Endpoint para buscar items por múltiples criterios.
    """
    # Convertir fechas si son proporcionadas
    fecha_inicio_dt = None
    fecha_fin_dt = None

    try:
        if p_fecha_inicio:
            fecha_inicio_dt = datetime.strptime(p_fecha_inicio, "%Y-%m-%d")
        if p_fecha_fin:
            fecha_fin_dt = datetime.strptime(p_fecha_fin, "%Y-%m-%d")
    except ValueError:
        return JSONResponse(
            {"error": "Formato de fecha inválido. Use YYYY-MM-DD."},
            status_code=400
        )

    query = """
    SELECT * FROM buscar_items_multi_criterio($1, $2, $3, $4, $5)
    """
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch(
            query, 
            p_descripcion, 
            p_departamento, 
            p_comprador, 
            fecha_inicio_dt, 
            fecha_fin_dt
        )
        result = [dict(row) for row in rows]
        return result
#ENDPOINTS DE PRUEBA
@app.get("/items")
async def get_all_items():
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM items")
        return rows
@app.get("/parties")
async def get_all_parties():
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM parties")
        return rows
@app.get("/tenders")
async def get_all_tenders():
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM tenders ")
        return rows
@app.get("/tenderers")
async def get_all_tenderers():
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM tenderers ")
        return rows
@app.get("/documents")
async def get_all_documents():
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM documents ")
        return rows
@app.get("/buyers")
async def get_all_buyers():
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM buyers ")
        return rows       
