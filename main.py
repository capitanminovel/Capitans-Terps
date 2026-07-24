from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from db import init_db
from routers import strains, research

app = FastAPI(title="Capitan's Terps Grows")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(strains.router)
app.include_router(research.router)

BASE = Path(__file__).parent


@app.get("/")
def root():
    return FileResponse(BASE / "static" / "index.html")


app.mount("/images", StaticFiles(directory=str(BASE / "images")), name="images")
app.mount("/static", StaticFiles(directory=str(BASE / "static")), name="static")
