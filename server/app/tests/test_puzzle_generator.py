from itertools import chain
from unittest.mock import mock_open, patch

import pytest
import yaml

from app.models import Puzzle, Tile
from app.puzzle_generator import generate_puzzle
from app.settings import CONFIG_DIR


def flatten_racks(racks: list[list[Tile]]) -> list[Tile]:
    """Helper function to convert a list of racks into a single list of tiles."""
    return list(chain.from_iterable(racks))


def test_generate_puzzle_with_seed_is_deterministic():
    """
    GIVEN a seed value
    WHEN generate_puzzle_logic is called twice with the same seed
    THEN the generated puzzles should be identical.
    """
    puzzle1 = generate_puzzle(seed=42)
    puzzle2 = generate_puzzle(seed=42)

    assert puzzle1 == puzzle2
    # Also check they are not the same object in memory
    assert puzzle1 is not puzzle2

    # And that a different seed produces a different puzzle
    puzzle3 = generate_puzzle(seed=101)
    assert puzzle1 != puzzle3


def test_generate_puzzle_structure_and_tile_count():
    """
    GIVEN a call to generate_puzzle_logic
    WHEN a puzzle is generated
    THEN it should have the correct structure and number of tiles.
    """
    puzzle = generate_puzzle(seed=1)

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
    puzzle = generate_puzzle(seed=2)

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
    words_path = CONFIG_DIR / "words-common.txt"
    with open(words_path, "r", encoding="utf-8") as f:
        valid_words = {line.strip().upper() for line in f if line.strip()}

    puzzle = generate_puzzle(seed=3)

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
    puzzle = generate_puzzle(seed=4)
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

    mock_rules = "multipliers:\n  3: 1"  # These rules aren't valid, but the generator should fail before that

    def mock_open_logic(file_path, *args, **kwargs):
        if "words-common.txt" in str(file_path):
            return mock_open(read_data=mock_words).return_value
        if "game_rules.yaml" in str(file_path):
            return mock_open(read_data=mock_rules).return_value
        raise FileNotFoundError(f"Unexpected file open: {file_path}")

    mock_open_builtin.side_effect = mock_open_logic

    with pytest.raises(ValueError, match="Could not find words of all required lengths"):
        generate_puzzle()


@patch("builtins.open")
def test_generator_handles_missing_letter_values(mock_open_builtin):
    """
    GIVEN a game_rules.yaml file missing the 'letter_values' key
    WHEN generate_puzzle_logic is called
    THEN it should run without error and assign a value of 0 to all tiles.
    """
    # Mock game_rules.yaml to be empty or missing the key
    mock_rules = "multipliers:\n  3: 1"  # Some valid YAML without letter_values
    mock_words = "CAT\nDOGS\nBEAST\nTESTER"

    def mock_open_logic(file_path, *args, **kwargs):
        if "words-common.txt" in str(file_path):
            return mock_open(read_data=mock_words).return_value
        if "game_rules.yaml" in str(file_path):
            return mock_open(read_data=mock_rules).return_value
        raise FileNotFoundError(f"Unexpected file open: {file_path}")

    mock_open_builtin.side_effect = mock_open_logic

    puzzle = generate_puzzle(seed=5)
    all_tiles = flatten_racks(puzzle.initial_racks)

    # All tiles should have a value of 0
    assert all(tile.value == 0 for tile in all_tiles)


@patch("builtins.open")
def test_generator_handles_letter_not_in_values(mock_open_builtin):
    """
    GIVEN a word is chosen that contains a letter not in the game_rules
    WHEN generate_puzzle_logic is called
    THEN it should assign a value of 0 to that tile.
    """
    # Use a real word list but a modified rules file
    mock_rules_dict = {"letter_values": {"A": 1, "B": 1, "C": 1}}  # Missing 'T'
    mock_rules_yaml = yaml.dump(mock_rules_dict)

    # Mock a word list that is guaranteed to produce a word with 'T'
    mock_words = "CAT\nDOGS\nBEAST\nTESTER"

    def mock_open_logic(file_path, *args, **kwargs):
        if "words-common.txt" in str(file_path):
            return mock_open(read_data=mock_words).return_value
        if "game_rules.yaml" in str(file_path):
            return mock_open(read_data=mock_rules_yaml).return_value
        raise FileNotFoundError(f"Unexpected file open: {file_path}")

    mock_open_builtin.side_effect = mock_open_logic

    puzzle = generate_puzzle(seed=6)  # Seed doesn't matter much here

    target_tiles = flatten_racks(puzzle.target_solution)

    tile_t = next((tile for tile in target_tiles if tile.letter == "T"), None)
    tile_c = next((tile for tile in target_tiles if tile.letter == "C"), None)

    assert tile_t is not None
    assert tile_t.value == 0  # 'T' is not in our mocked rules

    assert tile_c is not None
    assert tile_c.value == 1  # 'C' is in our mocked rules
