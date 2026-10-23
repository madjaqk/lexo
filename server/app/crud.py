import datetime
import json
from functools import cache
from typing import cast

import yaml
from redis import Redis
from sqlalchemy.exc import NoResultFound
from sqlmodel import Session, func, select

from app.models import PuzzleWithDate
from app.settings import get_settings


def redis_key_for_date(date: datetime.date) -> str:
    """Small helper function to standardize the Redis key format."""
    return f"puzzle:{date.isoformat()}"


def get_puzzle_by_date(
    db: Session, date: datetime.date, *, redis_client: Redis | None = None
) -> PuzzleWithDate | None:
    """
    Retrieves a puzzle from the database by its date.

    Args:
        db: The database session.
        date: The date of the puzzle to retrieve.

    Returns:
        The PuzzleWithDate object if found, otherwise None.
    """
    if redis_client:
        cached_puzzle = redis_client.get(redis_key_for_date(date))
        cached_puzzle = cast(str | None, cached_puzzle)
        if cached_puzzle:
            # It seems like we should be able to use PuzzleWithDate.model_validate_json() rather
            # than deserializing ourselves, but apparently model_validate_json doesn't actually
            # validate the JSON, it just parses it, at least for models that are also database
            # tables.  (This includes not converting, say, the date string into a datetime.date
            # object).  See:
            # https://github.com/fastapi/sqlmodel/discussions/961
            # https://github.com/fastapi/sqlmodel/issues/453
            cached_puzzle = json.loads(cached_puzzle)
            return PuzzleWithDate.model_validate(cached_puzzle)

    db_puzzle = db.get(PuzzleWithDate, date)
    if db_puzzle and redis_client:
        redis_client.set(redis_key_for_date(date), db_puzzle.model_dump_json())

    return db_puzzle


@cache
def load_game_rules_from_yaml() -> dict:
    """
    Loads and parses the game rules from game_rules.yaml.

    The rules file doesn't change while the server is running, so the result is cached.  This
    function must take no arguments: anything request-specific (like a DB session) would become
    part of the cache key, so every call would add a new, never-evicted cache entry.  Callers
    must not mutate the returned dict.

    It will raise FileNotFoundError or YAMLError if the file is missing or malformed.
    """
    settings = get_settings()
    rules_path = settings.config_directory / "game_rules.yaml"
    with open(rules_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_earliest_puzzle_date(db: Session) -> datetime.date:
    """
    Finds the earliest puzzle date in the DB.

    This is a cheap indexed lookup (MIN of the primary key), so it isn't cached.  It will raise
    NoResultFound if there are no puzzles in the DB (suggesting larger problems).
    """
    # This statement correctly uses select() to wrap the aggregate function,
    # which satisfies type checkers like Pylance.
    statement = select(func.min(PuzzleWithDate.date))

    # .one() will return the date object, or None if the table is empty.
    earliest_date = db.exec(statement).one()

    if earliest_date is None:
        # Manually raising NoResultFound is appropriate here. It signals that a
        # required piece of data could not be found, and it aligns with the
        # expectations of the test suite.
        raise NoResultFound("No puzzles found in the database to determine the earliest date.")

    return earliest_date


def get_game_rules(db: Session) -> dict:
    """
    Combines the static game rules with the earliest puzzle date and the current date.

    Returns a new dict on every call, so the cached rules are never mutated.
    """
    return {
        **load_game_rules_from_yaml(),
        "earliest_date": get_earliest_puzzle_date(db).isoformat(),
        "current_date": datetime.date.today().isoformat(),
    }
