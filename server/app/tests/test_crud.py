import datetime
from unittest.mock import mock_open, patch

import pytest
import yaml
from sqlmodel import Session
from sqlalchemy.exc import NoResultFound

from app.crud import (
    get_earliest_puzzle_date,
    get_game_rules,
    get_puzzle_by_date,
    load_game_rules_from_yaml,
    redis_key_for_date,
)
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
def clear_load_game_rules_cache():
    """Fixture to clear the cache for load_game_rules_from_yaml before and after each test."""
    load_game_rules_from_yaml.cache_clear()
    yield
    load_game_rules_from_yaml.cache_clear()


@pytest.mark.usefixtures("clear_load_game_rules_cache")
class TestLoadGameRulesFromYaml:
    @patch("builtins.open", new_callable=mock_open, read_data="timer_seconds: 300\n")
    def test_load_game_rules_success(self, mock_file):
        """
        GIVEN a valid game_rules.yaml file
        WHEN load_game_rules_from_yaml is called
        THEN it should return the parsed dictionary.
        """
        assert load_game_rules_from_yaml() == {"timer_seconds": 300}
        mock_file.assert_called_once()

    @patch("builtins.open", new_callable=mock_open, read_data="timer_seconds: 300\n")
    def test_load_game_rules_is_cached(self, mock_file):
        """
        GIVEN a game_rules.yaml file
        WHEN load_game_rules_from_yaml is called multiple times
        THEN the file should only be read once, and the cache should hold a single entry.
        """
        load_game_rules_from_yaml()
        load_game_rules_from_yaml()

        mock_file.assert_called_once()
        assert load_game_rules_from_yaml.cache_info().currsize == 1

    @patch("builtins.open", side_effect=FileNotFoundError)
    def test_load_game_rules_file_not_found(self, mock_file):
        """
        GIVEN the game_rules.yaml file does not exist
        WHEN load_game_rules_from_yaml is called
        THEN it should raise FileNotFoundError.
        """
        with pytest.raises(FileNotFoundError):
            load_game_rules_from_yaml()

    @patch("builtins.open", new_callable=mock_open, read_data="not: valid: yaml")
    def test_load_game_rules_malformed_yaml(self, mock_file):
        """
        GIVEN a game_rules.yaml file that is not valid YAML
        WHEN load_game_rules_from_yaml is called
        THEN it should raise a YAMLError.
        """
        with pytest.raises(yaml.YAMLError):
            load_game_rules_from_yaml()


class TestGetEarliestPuzzleDate:
    def test_get_earliest_puzzle_date_success(self, session: Session):
        """
        GIVEN multiple puzzles in the DB
        WHEN get_earliest_puzzle_date is called
        THEN it should return the earliest date.
        """
        for day in (3, 1, 2):
            session.add(
                PuzzleWithDate(
                    date=datetime.date(2025, 1, day), initial_racks=[[]], target_solution=[[]]
                )
            )
        session.commit()

        assert get_earliest_puzzle_date(session) == datetime.date(2025, 1, 1)

    def test_get_earliest_puzzle_date_no_puzzles_in_db(self, session: Session):
        """
        GIVEN no puzzles in the database
        WHEN get_earliest_puzzle_date is called
        THEN it should raise NoResultFound.
        """
        with pytest.raises(NoResultFound):
            get_earliest_puzzle_date(session)


@pytest.mark.usefixtures("clear_load_game_rules_cache")
class TestGetGameRules:
    @patch("app.crud.get_earliest_puzzle_date", return_value=datetime.date(2025, 1, 1))
    @patch("app.crud.load_game_rules_from_yaml", return_value={"timer_seconds": 300})
    @patch("app.crud.datetime")
    def test_get_game_rules_combines_sources(
        self, mock_datetime, mock_load_rules, mock_earliest_date, session: Session
    ):
        """
        GIVEN static game rules and an earliest puzzle date
        WHEN get_game_rules is called
        THEN it should return the rules plus the earliest date and the current date.
        """
        mock_today = datetime.date(2025, 8, 15)
        mock_datetime.date.today.return_value = mock_today

        final_config = get_game_rules(session)

        mock_earliest_date.assert_called_once_with(session)
        assert final_config == {
            "timer_seconds": 300,
            "earliest_date": "2025-01-01",
            "current_date": mock_today.isoformat(),
        }

    @patch("builtins.open", new_callable=mock_open, read_data="timer_seconds: 300\n")
    def test_get_game_rules_does_not_mutate_cached_rules(self, mock_file, session: Session):
        """
        GIVEN a puzzle in the DB
        WHEN get_game_rules is called
        THEN the cached static rules should not pick up the per-request keys.
        """
        session.add(
            PuzzleWithDate(
                date=datetime.date(2025, 1, 1), initial_racks=[[]], target_solution=[[]]
            )
        )
        session.commit()

        get_game_rules(session)

        assert load_game_rules_from_yaml() == {"timer_seconds": 300}

    @patch("builtins.open", new_callable=mock_open, read_data="timer_seconds: 300\n")
    def test_get_game_rules_does_not_grow_cache_across_sessions(self, mock_file, session: Session):
        """
        GIVEN a puzzle in the DB
        WHEN get_game_rules is called with several different sessions
        THEN the rules file should be read once and the cache should hold a single entry.
        (Regression test: the cache used to be keyed on the session, leaking memory per request.)
        """
        session.add(
            PuzzleWithDate(
                date=datetime.date(2025, 1, 1), initial_racks=[[]], target_solution=[[]]
            )
        )
        session.commit()

        for _ in range(3):
            with Session(session.get_bind()) as new_session:
                get_game_rules(new_session)

        mock_file.assert_called_once()
        assert load_game_rules_from_yaml.cache_info().currsize == 1
