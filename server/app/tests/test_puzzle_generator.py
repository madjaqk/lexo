import datetime
from itertools import chain
from unittest.mock import mock_open, patch

import pytest

from app.models import Puzzle, Tile, LetterValuesDict
from app.puzzle_generator import generate_puzzle, get_letter_values_for_date
from app.settings import get_settings


def flatten_racks(racks: list[list[Tile]]) -> list[Tile]:
    """Helper function to convert a list of racks into a single list of tiles."""
    return list(chain.from_iterable(racks))


##################################
# get_letter_values_for_date tests
##################################

MOCK_VALUES_FROM_YAML = {
    datetime.date(1900, 1, 1): {
        "A": 1,
    },
    datetime.date(2023, 1, 1): {
        "A": 2,
    },
    datetime.date(2024, 1, 1): {
        "A": 3,
    },
}


@pytest.mark.parametrize(
    "date,expected_value",
    [
        (datetime.date(1950, 6, 15), 1),  # Between first and second effective date
        (datetime.date(2023, 1, 1), 2),  # Exactly on second effective date
        (datetime.date(2023, 6, 15), 2),  # Between second and third effective date
        (datetime.date(2025, 12, 31), 3),  # After last effective date
    ],
)
def test_get_rules_for_date_returns_correct_rules(date, expected_value):
    """
    GIVEN a date
    WHEN get_rules_for_date is called
    THEN it should return the correct game rules for that date.
    """
    # Mock the load_game_rules_from_yaml_file function to return a controlled set of rules
    with patch(
        "app.puzzle_generator.load_letter_values_from_yaml_file", return_value=MOCK_VALUES_FROM_YAML
    ):
        # Test dates before the first effective date
        letter_values = get_letter_values_for_date(date)
    assert letter_values["A"] == expected_value


def test_get_rules_for_date_raises_for_no_rules():
    """
    GIVEN a date before any effective rules
    WHEN get_rules_for_date is called
    THEN it should raise a ValueError.
    """
    with patch(
        "app.puzzle_generator.load_letter_values_from_yaml_file", return_value=MOCK_VALUES_FROM_YAML
    ):
        with pytest.raises(ValueError, match="No letter values found for date"):
            get_letter_values_for_date(datetime.date(1800, 1, 1))


#######################
# generate_puzzle tests
#######################

LETTER_VALUES: LetterValuesDict = {"A": 1, "B": 2, "C": 3}


def test_generate_puzzle_with_seed_is_deterministic():
    """
    GIVEN a seed value
    WHEN generate_puzzle_logic is called twice with the same seed
    THEN the generated puzzles should be identical.
    """
    puzzle1 = generate_puzzle(LETTER_VALUES, seed=42)
    puzzle2 = generate_puzzle(LETTER_VALUES, seed=42)

    assert puzzle1 == puzzle2
    # Also check they are not the same object in memory
    assert puzzle1 is not puzzle2

    # And that a different seed produces a different puzzle
    puzzle3 = generate_puzzle(LETTER_VALUES, seed=101)
    assert puzzle1 != puzzle3


def test_generate_puzzle_structure_and_tile_count():
    """
    GIVEN a call to generate_puzzle_logic
    WHEN a puzzle is generated
    THEN it should have the correct structure and number of tiles.
    """
    puzzle = generate_puzzle(LETTER_VALUES, seed=1)

    assert isinstance(puzzle, Puzzle)

    # Check rack structure
    assert len(puzzle.initial_racks) == 4
    assert len(puzzle.target_solution) == 4

    # Check rack lengths
    assert [len(r) for r in puzzle.initial_racks] == [3, 4, 5, 6]
    assert [len(r) for r in puzzle.target_solution] == [3, 4, 5, 6]


def test_tile_conservation():
    """
    GIVEN a generated puzzle
    WHEN comparing initial and target tiles
    THEN the set of tiles should be identical, just arranged differently.
    """
    puzzle = generate_puzzle(LETTER_VALUES, seed=2)

    initial_tiles = flatten_racks(puzzle.initial_racks)
    target_tiles = flatten_racks(puzzle.target_solution)

    # To compare the sets of tiles, we need a hashable representation.
    # A tuple of sorted items from the model's dict is a reliable way to do this.
    initial_tile_set = {tuple(sorted(t.model_dump().items())) for t in initial_tiles}
    target_tile_set = {tuple(sorted(t.model_dump().items())) for t in target_tiles}

    assert initial_tile_set == target_tile_set


def test_target_solution_is_valid():
    """
    GIVEN a generated puzzle
    WHEN inspecting the target solution
    THEN it should consist of four valid words of increasing length.
    """
    # Load the valid words to check against
    settings = get_settings()
    words_path = settings.config_directory / "words-common.txt"
    with open(words_path, "r", encoding="utf-8") as f:
        valid_words = {line.strip().upper() for line in f if line.strip()}

    puzzle = generate_puzzle(LETTER_VALUES, seed=3)

    expected_lengths = [3, 4, 5, 6]
    for i, rack in enumerate(puzzle.target_solution):
        word = "".join(tile.letter for tile in rack)
        assert len(word) == expected_lengths[i]
        assert word in valid_words


def test_initial_racks_are_shuffled_correctly():
    """
    GIVEN a generated puzzle
    WHEN inspecting the initial racks
    THEN the tiles should be sorted by their numeric ID.
    """
    puzzle = generate_puzzle(LETTER_VALUES, seed=4)
    initial_tiles = flatten_racks(puzzle.initial_racks)
    tile_ids = [int(tile.id.split("-")[1]) for tile in initial_tiles]

    # The tiles in the initial racks should be sorted by their ID, which were
    # randomly assigned from the range 1-18.
    assert tile_ids == sorted(tile_ids)


@patch("builtins.open")
def test_generator_raises_error_for_missing_word_lengths(mock_open_builtin):
    """
    GIVEN a word list missing required word lengths
    WHEN generate_puzzle_logic is called
    THEN it should raise a ValueError.
    """
    # Mock word list missing 5-letter words
    mock_words = "CAT\nDOGS\n"

    def mock_open_logic(file_path, *args, **kwargs):
        if "words-common.txt" in str(file_path):
            return mock_open(read_data=mock_words).return_value
        raise FileNotFoundError(f"Unexpected file open: {file_path}")

    mock_open_builtin.side_effect = mock_open_logic

    with pytest.raises(ValueError, match="Could not find words of all required lengths"):
        generate_puzzle(LETTER_VALUES)


@patch("builtins.open")
def test_generator_handles_letter_not_in_values(mock_open_builtin):
    """
    GIVEN a word is chosen that contains a letter not in the game_rules
    WHEN generate_puzzle_logic is called
    THEN it should assign a value of 0 to that tile.
    """

    # Mock a word list that is guaranteed to produce a word with 'T'
    mock_words = "CAT\nDOGS\nBEAST\nTESTER"

    def mock_open_logic(file_path, *args, **kwargs):
        if "words-common.txt" in str(file_path):
            return mock_open(read_data=mock_words).return_value
        raise FileNotFoundError(f"Unexpected file open: {file_path}")

    mock_open_builtin.side_effect = mock_open_logic

    puzzle = generate_puzzle(LETTER_VALUES)

    target_tiles = flatten_racks(puzzle.target_solution)

    tile_t = next((tile for tile in target_tiles if tile.letter == "T"), None)
    tile_c = next((tile for tile in target_tiles if tile.letter == "C"), None)

    assert tile_t is not None
    assert tile_t.value == 0  # 'T' is not in our mocked letter values

    assert tile_c is not None
    assert tile_c.value == 3  # 'C' is in our mocked letter values
