import datetime
from contextlib import asynccontextmanager

import yaml
from fastapi import Depends, FastAPI, HTTPException
from sqlmodel import Session

from . import crud
from .database import create_db_and_tables, get_session
from .logging_config import setup_logging
from .models import GameRules, PuzzleWithDate


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    setup_logging()
    create_db_and_tables()
    yield
    # Code to run on shutdown
    # (no cleanup needed for SQLite)


app = FastAPI(title="Tile Game API", lifespan=lifespan)


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Tile Game API!"}


@app.get("/api/puzzle/today", response_model=PuzzleWithDate, tags=["Puzzles"])
def get_todays_puzzle(db: Session = Depends(get_session)):
    """
    Get the puzzle for the current date.
    """
    today = datetime.date.today()
    puzzle = crud.get_puzzle_by_date(db, today)
    if puzzle is None:
        raise HTTPException(
            status_code=404, detail="Puzzle not found for today's date."
        )
    return puzzle


@app.get("/api/puzzle/{date}", response_model=PuzzleWithDate, tags=["Puzzles"])
def get_puzzle_by_date(date: datetime.date, db: Session = Depends(get_session)):
    """
    Get the puzzle for a specific date.
    """
    today = datetime.date.today()
    if date > today:
        raise HTTPException(status_code=403, detail="No spoilers!")

    puzzle = crud.get_puzzle_by_date(db, date)
    if puzzle is None:
        raise HTTPException(
            status_code=404, detail=f"Puzzle not found for date {date.isoformat()}."
        )
    return puzzle


@app.get("/api/config", tags=["Configuration"])
def get_config():
    """
    Get the game configuration rules.
    """
    try:
        rules_dict = crud.get_game_rules()
        return GameRules.model_validate(rules_dict)
    except (FileNotFoundError, yaml.YAMLError):
        raise HTTPException(
            status_code=500, detail="Could not load game configuration."
        )
