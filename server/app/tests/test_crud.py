import datetime
from unittest.mock import mock_open, patch

import pytest
import yaml
from sqlmodel import Session
from sqlalchemy.exc import NoResultFound

from app.crud import get_game_rules, get_puzzle_by_date, get_stable_game_rules, redis_key_for_date
from app.models import PuzzleWithDate, Tile

##########################
# get_puzzle_by_date tests
##########################


def test_get_puzzle_by_date_success(session: Session):
    """
    GIVEN a puzzle exists for a specific date in the database
    WHEN get_puzzle_by_date is called with that date
    THEN it should return the correct PuzzleWithDate object.
    """
    test_date = datetime.date(2025, 10, 20)
    puzzle = PuzzleWithDate(
        date=test_date,
        initial_racks=[[Tile(id="tile-1", letter="A", value=1)]],
        target_solution=[[Tile(id="tile-1", letter="A", value=1)]],
    )
    session.add(puzzle)
    session.commit()
    session.expunge_all()

    retrieved_puzzle = get_puzzle_by_date(session, test_date)
    assert retrieved_puzzle is not None
    assert retrieved_puzzle.date == test_date
    assert retrieved_puzzle.initial_racks == [[Tile(id="tile-1", letter="A", value=1)]]


def test_get_puzzle_by_date_not_found(session: Session):
    """
    GIVEN no puzzle exists for a specific date
    WHEN get_puzzle_by_date is called with that date
    THEN it should return None.
    """
    test_date = datetime.date(2025, 10, 21)
    retrieved_puzzle = get_puzzle_by_date(session, test_date)
    assert retrieved_puzzle is None


def test_get_puzzle_by_date_reads_from_cache_if_redis_client_is_provided(
    session: Session, fake_redis
):
    """
    WHEN get_puzzle_by_date is called with a Redis client
    THEN it should attempt to read from the cache first.
    """
    test_date = datetime.date(2025, 10, 20)
    puzzle = PuzzleWithDate(
        date=test_date,
        initial_racks=[[Tile(id="tile-1", letter="A", value=1)]],
        target_solution=[[Tile(id="tile-1", letter="A", value=1)]],
    )
    session.add(puzzle)
    session.commit()
    session.expunge_all()

    puzzle_in_cache = PuzzleWithDate(
        date=test_date,
        initial_racks=[[Tile(id="tile-1", letter="B", value=2)]],
        target_solution=[[Tile(id="tile-1", letter="B", value=2)]],
    )

    fake_redis.set(redis_key_for_date(test_date), puzzle_in_cache.model_dump_json())

    # This should retrieve the value from the cache, not the puzzle in the DB
    retrieved_puzzle = get_puzzle_by_date(session, test_date, redis_client=fake_redis)
    assert retrieved_puzzle is not None
    assert retrieved_puzzle.date == test_date
    assert retrieved_puzzle.initial_racks == puzzle_in_cache.initial_racks
    assert retrieved_puzzle.target_solution == puzzle_in_cache.target_solution


def test_get_puzzle_by_date_falls_back_to_db_if_cache_miss(session: Session, fake_redis):
    """
    GIVEN the cache is empty
    WHEN get_puzzle_by_date is called with a Redis client
    THEN it should fall back to querying the database.
    """
    test_date = datetime.date(2025, 10, 20)
    puzzle_data = {
        "date": test_date,
        "initial_racks": [[Tile(id="tile-1", letter="A", value=1)]],
        "target_solution": [[Tile(id="tile-1", letter="A", value=1)]],
    }
    puzzle = PuzzleWithDate(**puzzle_data)
    session.add(puzzle)
    session.commit()
    session.expunge_all()

    assert fake_redis.get(redis_key_for_date(test_date)) is None

    retrieved_puzzle = get_puzzle_by_date(session, test_date, redis_client=fake_redis)
    assert retrieved_puzzle is not None
    assert retrieved_puzzle.date == test_date
    assert retrieved_puzzle.initial_racks == puzzle_data["initial_racks"]
    assert retrieved_puzzle.target_solution == puzzle_data["target_solution"]

    puzzle_in_cache = fake_redis.get(redis_key_for_date(test_date))
    assert puzzle_in_cache is not None
    assert puzzle_in_cache == retrieved_puzzle.model_dump_json()


def test_get_puzzle_by_date_does_not_use_cache_if_redis_client_is_None(
    session: Session, fake_redis
):
    """
    WHEN get_puzzle_by_date is called with redis_client=None
    THEN it should not attempt to read from or write to the cache.

    Note that other tests use the form get_puzzle_by_date(session, date) without specifying
    redis_client at all, which results in redis_client being None implicitly; this test is just
    that nothing weird happens if redis_client is explicitly None.
    """
    test_date = datetime.date(2025, 10, 20)
    puzzle_data = {
        "date": test_date,
        "initial_racks": [[Tile(id="tile-1", letter="A", value=1)]],
        "target_solution": [[Tile(id="tile-1", letter="A", value=1)]],
    }
    puzzle = PuzzleWithDate(**puzzle_data)
    session.add(puzzle)
    session.commit()
    session.expunge_all()

    assert fake_redis.get(redis_key_for_date(test_date)) is None

    retrieved_puzzle = get_puzzle_by_date(session, test_date, redis_client=None)
    assert retrieved_puzzle is not None

    assert fake_redis.get(redis_key_for_date(test_date)) is None


######################
# get_game_rules tests
######################


@pytest.fixture()
def clear_get_stable_game_rules_cache():
    """Fixture to clear the cache for get_game_rules before each test."""
    get_stable_game_rules.cache_clear()


@pytest.mark.usefixtures("clear_get_stable_game_rules_cache")
class TestGetStableGameRules:
    @patch("builtins.open", new_callable=mock_open, read_data="timer_seconds: 300\n")
    def test_get_stable_game_rules_success(self, mock_file, session: Session):
        """
        GIVEN a valid game_rules.yaml file and a puzzle in the DB
        WHEN get_stable_game_rules is called
        THEN it should return the parsed dictionary including the earliest date.
        """
        # Add a puzzle to the DB to establish an earliest date
        test_date = datetime.date(2025, 1, 1)
        puzzle = PuzzleWithDate(date=test_date, initial_racks=[[]], target_solution=[[]])
        session.add(puzzle)
        session.commit()

        rules = get_stable_game_rules(session)
        assert rules == {"timer_seconds": 300, "earliest_date": test_date.isoformat()}
        mock_file.assert_called_once()

    @patch("builtins.open", new_callable=mock_open, read_data="timer_seconds: 300\n")
    def test_get_stable_game_rules_is_cached(self, mock_file, session: Session):
        """
        GIVEN a game_rules.yaml file and puzzles in the DB
        WHEN get_stable_game_rules is called multiple times
        THEN the file should only be read once and the DB queried once.
        """
        # Add a puzzle to the DB
        test_date = datetime.date(2025, 1, 1)
        puzzle = PuzzleWithDate(date=test_date, initial_racks=[[]], target_solution=[[]])
        session.add(puzzle)
        session.commit()

        # Spy on the session's exec method to check DB calls
        with patch.object(session, "exec", wraps=session.exec) as spy_exec:
            get_stable_game_rules(session)  # First call
            get_stable_game_rules(session)  # Second call

            mock_file.assert_called_once()
            # The DB should only be queried for the min date on the first call
            assert spy_exec.call_count == 1
            mock_file.assert_called_once()

    @patch("builtins.open", side_effect=FileNotFoundError)
    def test_get_stable_game_rules_file_not_found(self, mock_file, session: Session):
        """
        GIVEN the game_rules.yaml file does not exist
        WHEN get_stable_game_rules is called
        THEN it should raise FileNotFoundError.
        """
        with pytest.raises(FileNotFoundError):
            get_stable_game_rules(session)

    @patch("builtins.open", new_callable=mock_open, read_data="not: valid: yaml")
    def test_get_stable_game_rules_malformed_yaml(self, mock_file, session: Session):
        """
        GIVEN a game_rules.yaml file that is not valid YAML
        WHEN get_stable_game_rules is called
        THEN it should raise a YAMLError.
        """
        with pytest.raises(yaml.YAMLError):
            get_stable_game_rules(session)

    @patch("builtins.open", new_callable=mock_open, read_data="timer_seconds: 300\n")
    def test_get_stable_game_rules_no_puzzles_in_db(self, mock_file, session: Session):
        """
        GIVEN a valid game_rules.yaml but no puzzles in the database
        WHEN get_stable_game_rules is called
        THEN it should raise NoResultFound.
        """
        # The session is empty by default
        with pytest.raises(NoResultFound):
            get_stable_game_rules(session)


class TestGetGameRules:
    @patch("app.crud.get_stable_game_rules")
    @patch("app.crud.datetime")
    def test_get_game_rules_adds_current_date(
        self, mock_datetime, mock_get_stable_rules, session: Session
    ):
        """
        GIVEN a set of stable game rules
        WHEN get_game_rules is called
        THEN it should add the current date to the rules.
        """
        # Mock the dependencies
        mock_stable_config = {"timer_seconds": 300, "earliest_date": "2025-01-01"}
        mock_get_stable_rules.return_value = mock_stable_config

        mock_today = datetime.date(2025, 8, 15)
        mock_datetime.date.today.return_value = mock_today

        # Call the function
        final_config = get_game_rules(session)

        # Assertions
        mock_get_stable_rules.assert_called_once_with(session)
        assert final_config["timer_seconds"] == 300
        assert final_config["earliest_date"] == "2025-01-01"
        assert final_config["current_date"] == mock_today.isoformat()
