import datetime
from unittest.mock import mock_open, patch

import pytest
import yaml
from sqlmodel import Session

from app.crud import get_game_rules, get_puzzle_by_date
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


######################
# get_game_rules tests
######################


@pytest.fixture()
def clear_get_game_rules_cache():
    """Fixture to clear the cache for get_game_rules before each test."""
    get_game_rules.cache_clear()


@pytest.mark.usefixtures("clear_get_game_rules_cache")
class TestGetGameRules:
    @patch("builtins.open", new_callable=mock_open, read_data="timer_seconds: 300\n")
    def test_get_game_rules_success(self, mock_file):
        """
        GIVEN a valid game_rules.yaml file
        WHEN get_game_rules is called
        THEN it should return the parsed dictionary.
        """
        rules = get_game_rules()
        assert rules == {"timer_seconds": 300}
        mock_file.assert_called_once()

    @patch("builtins.open", new_callable=mock_open, read_data="timer_seconds: 300\n")
    def test_get_game_rules_is_cached(self, mock_file):
        """
        GIVEN a game_rules.yaml file
        WHEN get_game_rules is called multiple times
        THEN the file should only be read once due to caching.
        """
        get_game_rules()  # First call
        get_game_rules()  # Second call
        mock_file.assert_called_once()

    @patch("builtins.open", side_effect=FileNotFoundError)
    def test_get_game_rules_file_not_found(self, mock_file):
        """
        GIVEN the game_rules.yaml file does not exist
        WHEN get_game_rules is called
        THEN it should raise FileNotFoundError.
        """
        with pytest.raises(FileNotFoundError):
            get_game_rules()

    @patch("builtins.open", new_callable=mock_open, read_data="not: valid: yaml")
    def test_get_game_rules_malformed_yaml(self, mock_file):
        """
        GIVEN a game_rules.yaml file that is not valid YAML
        WHEN get_game_rules is called
        THEN it should raise a YAMLError.
        """
        with pytest.raises(yaml.YAMLError):
            get_game_rules()
