""" Tests for API endpoints found in main.py """
import datetime
from unittest.mock import patch

import yaml
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import PuzzleWithDate, Tile

#########################
# get_puzzle_endpoint tests
#########################


def test_get_puzzle_success(session: Session, client: TestClient):
    """
    GIVEN a puzzle for a specific date exists in the database
    WHEN a GET request is made to /api/puzzle/{date}
    THEN it should return a 200 OK with the puzzle data including the date.
    """
    test_date = datetime.date(2025, 8, 22)
    puzzle_to_save = PuzzleWithDate(
        date=test_date,
        initial_racks=[[Tile(id="tile-1", letter="A", value=1)]],
        target_solution=[[Tile(id="tile-1", letter="A", value=1)]],
    )
    session.add(puzzle_to_save)
    session.commit()

    response = client.get(f"/api/puzzle/{test_date.isoformat()}")
    assert response.status_code == 200

    data = response.json()
    assert data["date"] == test_date.isoformat()
    assert data["initial_racks"] == [[{"id": "tile-1", "letter": "A", "value": 1}]]
    assert data["target_solution"] == [[{"id": "tile-1", "letter": "A", "value": 1}]]


def test_get_puzzle_not_found(client: TestClient):
    """
    GIVEN no puzzle exists for a specific date
    WHEN a GET request is made to /api/puzzle/{date}
    THEN it should return a 404 Not Found.
    """
    response = client.get("/api/puzzle/2024-01-01")
    assert response.status_code == 404
    assert "Puzzle not found" in response.json()["detail"]


def test_get_puzzle_invalid_date_format(client: TestClient):
    """
    GIVEN an invalid date format in the URL
    WHEN a GET request is made to /api/puzzle/{date}
    THEN it should return a 422 Unprocessable Entity.
    """
    response = client.get("/api/puzzle/not-a-real-date")
    assert response.status_code == 422


def test_get_puzzle_future_date(client: TestClient):
    """
    GIVEN a request for a puzzle for a future date
    WHEN a GET request is made
    THEN it should return a 403 Forbidden error.
    """
    future_date = datetime.date.today() + datetime.timedelta(days=1)
    response = client.get(f"/api/puzzle/{future_date.isoformat()}")
    assert response.status_code == 403
    assert "No spoilers!" in response.json()["detail"]


def test_get_todays_puzzle_success(session: Session, client: TestClient):
    """
    GIVEN a puzzle for today exists in the database
    WHEN a GET request is made to /api/puzzle/today
    THEN it should return a 200 OK with the puzzle data.
    """
    today = datetime.date.today()
    puzzle_to_save = PuzzleWithDate(
        date=today,
        initial_racks=[[Tile(id="tile-1", letter="T", value=1)]],
        target_solution=[[Tile(id="tile-1", letter="T", value=1)]],
    )
    session.add(puzzle_to_save)
    session.commit()

    response = client.get("/api/puzzle/today")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == today.isoformat()
    assert data["initial_racks"] == [[{"id": "tile-1", "letter": "T", "value": 1}]]
    assert data["target_solution"] == [[{"id": "tile-1", "letter": "T", "value": 1}]]


def test_get_todays_puzzle_not_found(client: TestClient):
    """
    GIVEN no puzzle exists for today
    WHEN a GET request is made to /api/puzzle/today
    THEN it should return a 404 Not Found.
    """
    response = client.get("/api/puzzle/today")
    assert response.status_code == 404
    assert "Puzzle not found" in response.json()["detail"]


######################
# get_game_rules tests
######################


@patch("app.main.crud.get_game_rules")
def test_get_config_success(mock_get_rules, client: TestClient):
    """
    GIVEN crud.get_game_rules returns a valid config dictionary
    WHEN a GET request is made to /api/config
    THEN it should return a 200 OK with the parsed config.
    """
    mock_config = {
        "multipliers": {3: 6, 4: 8},
        "letter_values": {"A": 1, "B": 3},
        "timer_seconds": 300,
    }
    mock_get_rules.return_value = mock_config

    response = client.get("/api/config")
    assert response.status_code == 200
    data = response.json()
    # FastAPI's jsonable_encoder will convert integer keys to strings for JSON
    assert data["multipliers"] == {"3": 6, "4": 8}
    assert data["letter_values"] == {"A": 1, "B": 3}
    assert data["timer_seconds"] == 300


@patch("app.main.crud.get_game_rules", side_effect=FileNotFoundError("File not found"))
def test_get_config_file_not_found(mock_get_rules, client: TestClient):
    """
    GIVEN crud.get_game_rules raises FileNotFoundError
    WHEN a GET request is made to /api/config
    THEN it should return a 500 Internal Server Error.
    """
    response = client.get("/api/config")
    assert response.status_code == 500
    assert "Could not load game configuration" in response.json()["detail"]


@patch("app.main.crud.get_game_rules", side_effect=yaml.YAMLError("Malformed YAML"))
def test_get_config_malformed_yaml(mock_get_rules, client: TestClient):
    """
    GIVEN crud.get_game_rules raises a YAMLError (indicating a malformed file)
    WHEN a GET request is made to /api/config
    THEN it should return a 500 Internal Server Error.
    """
    response = client.get("/api/config")
    assert response.status_code == 500
    assert "Could not load game configuration" in response.json()["detail"]
