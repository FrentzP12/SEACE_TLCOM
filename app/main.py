import asyncpg
from fastapi import FastAPI, Query
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
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
    allow_origins=["*"],  # Permite todos los orígenes (puedes especificar solo los necesarios)
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos HTTP (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos los encabezados
)

@app.get("/")
def root():
    return {"message": "API funcionando correctamente"}
# Resto de endpoints
@app.get("/items")
async def get_all_items():
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM items")
        result = [dict(row) for row in rows]  # Convierte a lista de diccionarios
        return result

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
@app.get("/contrataciones/{departamento}")
async def buscar_contrataciones_por_departamento(departamento: str):
    query = "SELECT * FROM buscar_contrataciones_por_departamento($1)"
    async with app.state.db.acquire() as conn:
                rows = await conn.fetch(query, departamento)
                result = [dict(row) for row in rows]
                return result
    
@app.get("/buscar_descripcion/{descripcion}")
async def buscar_por_descripcion_item(descripcion: str):
    query = "SELECT * FROM buscar_por_descripcion_item($1)"
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch(query, descripcion)
        result = [dict(row) for row in rows]
        return result
    
@app.get("/buscar_por_fecha")
async def buscar_por_fecha(
    fecha_inicio: str = Query(..., description="Fecha de inicio en formato YYYY-MM-DD"),
    fecha_fin: str = Query(..., description="Fecha de fin en formato YYYY-MM-DD")
):
    # Convertir las cadenas a objetos datetime.date
    try:
        fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
        fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
    except ValueError:
        return JSONResponse(
            {"error": "Formato de fecha inválido. Use YYYY-MM-DD."},
            status_code=400
        )

    query = "SELECT * FROM buscar_por_fecha_contrataciones($1, $2)"
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch(query, fecha_inicio_dt, fecha_fin_dt)
        result = [dict(row) for row in rows]
        return result
