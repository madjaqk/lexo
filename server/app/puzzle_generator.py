"""
Core business logic for generating a puzzle.

This module should be self-contained and not have dependencies on the
database or the web server. It takes game parameters and returns a
puzzle data structure.
"""

import random
import yaml

from .models import Puzzle, Tile
from .settings import get_settings


def generate_puzzle(seed: int | str | None = None) -> Puzzle:
    """
    Generates a new, solvable puzzle based on the game's configuration.

    This function creates a puzzle by selecting four words of increasing length
    (3, 4, 5, and 6 letters) from a common word list. It then assigns point
    values to each letter based on `game_rules.yaml`.

    The 18 tiles from these solution words are then "shuffled" by assigning them
    random IDs and sorting them into new initial racks for the player. This process
    ensures that every generated puzzle is solvable.

    The `seed` parameter can be used to generate a deterministic puzzle, which is
    useful for creating daily challenges that are the same for all players.

    Args:
        seed: An optional seed for the random number generator. Can be an
            integer or a string (e.g., a date string like '2025-08-07').
            Using a canonical string for daily puzzles avoids timezone issues.

    Returns:
        A Puzzle object containing the `initial_racks` for the player and the
        `target_solution` for scoring and validation.

    Raises:
        ValueError: If the common word list does not contain words of all
            required lengths (3, 4, 5, and 6).
    """
    settings = get_settings()
    if seed is not None:
        random.seed(f"{seed} {settings.puzzle_generation_salt}")

    # 1. Load words and game rules
    words_path = settings.config_directory / "words-common.txt"
    rules_path = settings.config_directory / "game_rules.yaml"

    with open(words_path, "r", encoding="utf-8") as f:
        all_words = [line.strip().upper() for line in f if line.strip()]

    with open(rules_path, "r", encoding="utf-8") as f:
        rules = yaml.safe_load(f)
    letter_values = rules.get("letter_values", {})

    # Group words by length
    words_by_length = {3: [], 4: [], 5: [], 6: []}
    for word in all_words:
        length = len(word)
        if length in words_by_length:
            words_by_length[length].append(word)

    # Choose one word of each required length
    try:
        solution_words = [
            random.choice(words_by_length[3]),
            random.choice(words_by_length[4]),
            random.choice(words_by_length[5]),
            random.choice(words_by_length[6]),
        ]
    except IndexError as e:
        raise ValueError(
            "Could not find words of all required lengths (3, 4, 5, 6) in words-common.txt"
        ) from e

    # 3. Generate a random permutation for tile IDs
    tile_ids = list(range(1, 19))
    random.shuffle(tile_ids)

    # 4. Create the target solution
    target_solution_racks = []
    all_solution_tiles = []
    for word in sorted(solution_words, key=len):
        rack = []
        for letter in word:
            # The docstring says 't{...}' and 0-padded, but ROADMAP.md shows 'tile-1'.
            # Following ROADMAP.md as the higher-level spec.
            tile_id = f"tile-{tile_ids.pop()}"
            tile = Tile(id=tile_id, letter=letter, value=letter_values.get(letter, 0))
            rack.append(tile)
            all_solution_tiles.append(tile)
        target_solution_racks.append(rack)

    # 5. Create the initial racks for the player by "shuffling" the tiles
    # according to their newly assigned random IDs.
    all_solution_tiles.sort(key=lambda t: int(t.id.split("-")[1]))

    initial_racks = [
        all_solution_tiles[0:3],
        all_solution_tiles[3:7],
        all_solution_tiles[7:12],
        all_solution_tiles[12:18],
    ]

    return Puzzle(initial_racks=initial_racks, target_solution=target_solution_racks)
