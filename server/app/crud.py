import datetime
from functools import cache

import yaml
from sqlalchemy.exc import NoResultFound
from sqlmodel import Session, func, select

from app.models import PuzzleWithDate
from app.settings import get_settings


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
def get_stable_game_rules(db: Session) -> dict:
    """
    Loads and parses the game rules from game_rules.yaml and finds the earliest puzzle date
    in the DB.

    The game rules and earliest puzzle date shouldn't change often (or maybe ever), so the
    results of this can be safely cached.  It will raise FileNotFoundError or YAMLError if the
    file is missing or malformed,  NoResultFound if there are no puzzles in the DB (suggesting
    larger problems), or MultipleResultsFound if multiple puzzles have the same minimum date
    (which shouldn't be possible due to uniqueness constraints in the DB).

    Returns:
        A dictionary containing the game rules and earliest puzzle date
    """
    settings = get_settings()
    rules_path = settings.config_directory / "game_rules.yaml"
    with open(rules_path, "r", encoding="utf-8") as f:
        rules = yaml.safe_load(f)

    # This statement correctly uses select() to wrap the aggregate function,
    # which satisfies type checkers like Pylance.
    statement = select(func.min(PuzzleWithDate.date))

    # .scalar() will return the date object, or None if the table is empty.
    earliest_date = db.exec(statement).one()

    if earliest_date is None:
        # Manually raising NoResultFound is appropriate here. It signals that a
        # required piece of data could not be found, and it aligns with the
        # expectations of the test suite.
        raise NoResultFound("No puzzles found in the database to determine the earliest date.")

    rules["earliest_date"] = earliest_date.isoformat()

    return rules


def get_game_rules(db: Session) -> dict:
    """
    Combines the stable, cached game rules with dynamic, per-request data.
    """
    config = get_stable_game_rules(db)
    config["current_date"] = datetime.date.today().isoformat()
    return config
