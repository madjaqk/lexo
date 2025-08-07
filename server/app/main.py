from contextlib import asynccontextmanager

from fastapi import FastAPI

from .database import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    create_db_and_tables()
    yield
    # Code to run on shutdown
    # (no cleanup needed for SQLite)


app = FastAPI(title="Tile Game API", lifespan=lifespan)


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Tile Game API!"}
