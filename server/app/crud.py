import datetime
from functools import cache

import yaml
from sqlmodel import Session

from .models import PuzzleWithDate
from .settings import CONFIG_DIR

from app.models import PuzzleWithDate


def get_puzzle_by_date(db: Session, date: datetime.date) -> PuzzleWithDate | None:
    """
    Retrieves a puzzle from the database by its date.

    Args:
        db: The database session.
        date: The date of the puzzle to retrieve.

    Returns:
        The PuzzleWithDate object if found, otherwise None.
    """
    return db.get(PuzzleWithDate, date)


@cache
def get_game_rules() -> dict:
    """
    Loads, parses, and caches the game rules from game_rules.yaml.

    This function is cached to avoid repeated file I/O and parsing for each
    request. It will raise FileNotFoundError or YAMLError if the file is
    missing or malformed, which will be caught by the API endpoint.

    Returns:
        A dictionary containing the game rules.
    """
    rules_path = CONFIG_DIR / "game_rules.yaml"
    with open(rules_path, "r", encoding="utf-8") as f:
        rules = yaml.safe_load(f)
    return rules
