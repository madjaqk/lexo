import datetime
from contextlib import asynccontextmanager

import yaml
from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.exc import NoResultFound, MultipleResultsFound
from sqlmodel import Session

from . import crud
from .database import create_db_and_tables, get_session
from .logging_config import setup_logging
from .models import GameRules, PuzzleWithDate
from .settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    setup_logging()
    create_db_and_tables()
    yield
    # Code to run on shutdown
    # (no cleanup needed for SQLite)


app = FastAPI(title="Tile Game API", lifespan=lifespan)

settings = get_settings()
if settings.environment == "dev":
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/api/puzzle/today", response_model=PuzzleWithDate, tags=["Puzzles"])
def get_todays_puzzle(db: Session = Depends(get_session)):
    """
    Get the puzzle for the current date.
    """
    today = datetime.date.today()
    puzzle = crud.get_puzzle_by_date(db, today)
    if not puzzle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Puzzle not found for today's date.")
    return puzzle


@app.get("/api/puzzle/{date}", response_model=PuzzleWithDate, tags=["Puzzles"])
def get_puzzle_by_date(date: datetime.date, db: Session = Depends(get_session)):
    """
    Get the puzzle for a specific date.
    """
    today = datetime.date.today()
    if date > today:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No spoilers!")

    puzzle = crud.get_puzzle_by_date(db, date)
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Puzzle not found for date {date.isoformat()}."
        )
    return puzzle


@app.get("/api/config", tags=["Configuration"])
def get_config(db: Session = Depends(get_session)):
    """
    Get the game configuration rules.
    """
    try:
        rules_dict = crud.get_game_rules(db)
        return GameRules.model_validate(rules_dict)
    except (FileNotFoundError, yaml.YAMLError, NoResultFound, MultipleResultsFound):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not load game configuration.")


settings = get_settings()

if settings.environment == "dev":
    # In development, we serve the built front-end files from FastAPI.
    # In production, Nginx will serve these files.
    # The `html=True` argument tells StaticFiles to serve `index.html` for
    # any path that doesn't otherwise match. This is perfect for SPAs.
    from fastapi.staticfiles import StaticFiles

    config_directory = settings.config_directory
    client_directory = config_directory.parent.parent / "client" / "build" / "dist"
    app.mount("/", StaticFiles(directory=client_directory, html=True), name="static")
