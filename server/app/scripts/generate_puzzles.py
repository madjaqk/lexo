"""Stand-alone script to generate daily puzzles and save them to the database.

This script uses Typer for its command-line interface. To run it, you must
first be in the `server` directory of the project, and then execute it as a
module:

    python -m app.scripts.generate_puzzles [OPTIONS]

This ensures that all project imports work correctly.

Usage Options:
    --days N: Generate puzzles for N days. Default: 1.
    --start YYYY-MM-DD: The start date for puzzle generation.
    --end YYYY-MM-DD: The end date for puzzle generation.

Behavior:
- If no options are provided, it generates a puzzle for the current day.
- If only --days is provided, it generates puzzles from today for N days.
- If --start and --end are provided, it generates puzzles for that inclusive range.
- If only --start is provided, it generates puzzles from that date for N days.
- If only --end is provided, it generates puzzles for N days ending on that date.

The script is idempotent: if a puzzle for a given date already exists in the
database, it will be skipped. All generated puzzles for a single run are
committed in a single database transaction.
"""
import datetime
import logging

import typer
from sqlmodel import Session
from typing_extensions import Annotated

from app.database import create_db_and_tables, get_session
from app.logging_config import setup_logging
from app.models import PuzzleWithDate
from app.puzzle_generator import generate_puzzle

app = typer.Typer()


def generate_daily_puzzle(date: datetime.date, db: Session):
    """
    Generates and stores a puzzle for a single date if it doesn't already exist.

    Args:
        date: The date for which to generate the puzzle.
        db: The database session to use for the transaction.
    """
    existing_puzzle = db.get(PuzzleWithDate, date)
    if existing_puzzle:
        logging.info(f"Puzzle for {date.isoformat()} already exists. Skipping.")
        return

    logging.info(f"Generating puzzle for {date.isoformat()}...")
    # Use the date's ISO format string as a stable seed for reproducibility.
    puzzle_data = generate_puzzle(seed=date.isoformat())

    new_puzzle = PuzzleWithDate(
        date=date,
        initial_racks=puzzle_data.initial_racks,
        target_solution=puzzle_data.target_solution,
    )
    db.add(new_puzzle)


def generate_daily_puzzles(start_date: datetime.date, end_date: datetime.date):
    """
    Generates and stores puzzles for a given date range.

    Args:
        start_date: The first date in the range.
        end_date: The last date in the range (inclusive).
    """

    from itertools import tee

    if start_date > end_date:
        logging.error("Start date cannot be after end date.")
        raise typer.Exit(code=1)

    logging.info(
        f"Processing puzzles from {start_date.isoformat()} to {end_date.isoformat()}."
    )
    # Use a single session and transaction for the entire batch.

    sessions, other_sessions = tee(get_session(), 2)

    for db in sessions:
        current_date = start_date
        while current_date <= end_date:
            generate_daily_puzzle(current_date, db)
            current_date += datetime.timedelta(days=1)
        db.commit()
    logging.info("Finished processing puzzles.")


@app.command()
def main(
    days: Annotated[
        int, typer.Option("--days", "-d", help="Generate puzzles for N days.")
    ] = 1,
    start: Annotated[
        datetime.datetime | None,
        typer.Option(formats=["%Y-%m-%d"], help="Start date (YYYY-MM-DD)."),
    ] = None,
    end: Annotated[
        datetime.datetime | None,
        typer.Option(formats=["%Y-%m-%d"], help="End date (YYYY-MM-DD)."),
    ] = None,
):
    """
    Main CLI function to determine date range and trigger puzzle generation.

    \bBehavior:
    - If no options are provided, it generates a puzzle for the current day.
    - If only --days is provided, it generates puzzles from today for N days.
    - If --start and --end are provided, it generates puzzles for that inclusive range.
    - If only --start is provided, it generates puzzles from that date for N days.
    - If only --end is provided, it generates puzzles for N days ending on that date.

    The script is idempotent: if a puzzle for a given date already exists in the
    database, it will be skipped. All generated puzzles for a single run are
    committed in a single database transaction.
    """
    # Setup logging and DB here, not at module level, to avoid interfering
    # with test runners and other tools that import this module.
    setup_logging()
    create_db_and_tables()

    today = datetime.date.today()
    if start and end:
        start_date = start.date()
        end_date = end.date()
    elif start:
        start_date = start.date()
        end_date = start_date + datetime.timedelta(days=days - 1)
    elif end:
        end_date = end.date()
        start_date = end_date - datetime.timedelta(days=days - 1)
    else:
        start_date = today
        end_date = today + datetime.timedelta(days=days - 1)

    generate_daily_puzzles(start_date, end_date)


if __name__ == "__main__":
    app()
