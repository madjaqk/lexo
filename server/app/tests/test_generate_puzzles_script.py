import datetime
import logging
from unittest.mock import patch

import pytest
import typer
from sqlmodel import Session, select
from typer.testing import CliRunner

from app.models import PuzzleWithDate
from app.scripts.generate_puzzles import (
    app,
    generate_daily_puzzle,
    generate_daily_puzzles,
)

runner = CliRunner()

#############################
# generate_daily_puzzle tests
#############################


def test_generate_daily_puzzle_success(session: Session):
    """
    GIVEN a date and a database session
    WHEN generate_daily_puzzle is called for a date that does not exist
    THEN a new puzzle should be created and added to the session.
    """
    test_date = datetime.date(2025, 8, 15)

    generate_daily_puzzle(test_date, session)
    session.commit()

    puzzle = session.get(PuzzleWithDate, test_date)
    assert puzzle is not None
    assert puzzle.date == test_date
    assert len(puzzle.initial_racks) == 4
    assert len(puzzle.target_solution) == 4


def test_generate_daily_puzzle_skips_generation_if_exists(session: Session, caplog):
    """
    GIVEN a date that already has a puzzle in the database
    WHEN generate_daily_puzzle is called for that date
    THEN it should not create a new puzzle and should log a skipping message.
    """
    caplog.set_level(logging.INFO)

    test_date = datetime.date(2025, 8, 16)

    # Create an initial puzzle to simulate an existing entry
    initial_puzzle = PuzzleWithDate(
        date=test_date, initial_racks=[[]], target_solution=[[]]
    )
    session.add(initial_puzzle)
    session.commit()
    session.refresh(initial_puzzle)

    generate_daily_puzzle(test_date, session)
    session.commit()

    puzzles = session.exec(select(PuzzleWithDate)).all()
    assert len(puzzles) == 1
    assert puzzles[0] == initial_puzzle  # No changes were made
    assert f"Puzzle for {test_date.isoformat()} already exists. Skipping." in caplog.text


def test_generate_daily_puzzle_uses_date_as_seed(session: Session):
    """
    GIVEN the same date is used as a seed
    WHEN generate_daily_puzzle is called twice
    THEN it should produce the exact same puzzle both times.
    """
    test_date = datetime.date(2025, 8, 17)

    # Generate first puzzle
    generate_daily_puzzle(test_date, session)
    session.commit()
    puzzle1 = session.get(PuzzleWithDate, test_date)
    assert puzzle1 is not None

    # Clear session and delete puzzle to regenerate
    session.delete(puzzle1)
    session.commit()
    session.expire_all()

    # Generate second puzzle with same date seed
    generate_daily_puzzle(test_date, session)
    session.commit()
    puzzle2 = session.get(PuzzleWithDate, test_date)
    assert puzzle2 is not None

    # Assert they are identical
    assert puzzle1.initial_racks == puzzle2.initial_racks
    assert puzzle1.target_solution == puzzle2.target_solution


##############################
# generate_daily_puzzles_tests
##############################


@patch("app.scripts.generate_puzzles.get_session")
def test_generate_daily_puzzles_generates_for_range(mock_get_session, session: Session):
    """
    GIVEN a date range
    WHEN generate_daily_puzzles is called
    THEN it should create puzzles for all dates in that range.
    """
    mock_get_session.return_value = iter([session])
    start_date = datetime.date(2025, 9, 1)
    end_date = datetime.date(2025, 9, 3)

    generate_daily_puzzles(start_date, end_date)

    puzzles = session.exec(select(PuzzleWithDate)).all()
    assert len(puzzles) == 3
    dates = {p.date for p in puzzles}
    assert dates == {
        datetime.date(2025, 9, 1),
        datetime.date(2025, 9, 2),
        datetime.date(2025, 9, 3),
    }


def test_generate_daily_puzzles_raises_error_for_bad_range():
    """
    GIVEN a start date that is after the end date
    WHEN generate_daily_puzzles is called
    THEN it should raise a typer.Exit with a non-zero exit code.
    """
    start_date = datetime.date(2025, 9, 12)
    end_date = datetime.date(2025, 9, 10)

    with pytest.raises(typer.Exit) as e:
        generate_daily_puzzles(start_date, end_date)
    assert e.value.exit_code == 1


#################
# CLI App tests #
#################


@patch("app.scripts.generate_puzzles.create_db_and_tables")
@patch("app.scripts.generate_puzzles.get_session")
def test_cli_default_generates_for_today(
    mock_get_session, mock_create_db, session: Session
):
    """
    GIVEN no command-line arguments
    WHEN the script is run
    THEN it should generate a puzzle for the current date.
    """
    mock_get_session.return_value = iter([session])
    today = datetime.date.today()
    result = runner.invoke(app)

    assert result.exit_code == 0, result.stdout
    puzzle = session.get(PuzzleWithDate, today)
    assert puzzle is not None
    assert puzzle.date == today


@patch("app.scripts.generate_puzzles.create_db_and_tables")
@patch("app.scripts.generate_puzzles.get_session")
def test_cli_with_days_option(mock_get_session, mock_create_db, session: Session):
    """
    GIVEN a --days argument
    WHEN the script is run
    THEN it should generate puzzles for that many days starting from today.
    """
    mock_get_session.return_value = iter([session])
    today = datetime.date.today()
    result = runner.invoke(app, ["--days", "3"])

    assert result.exit_code == 0, result.stdout
    puzzles = session.exec(select(PuzzleWithDate)).all()
    assert len(puzzles) == 3
    dates = {p.date for p in puzzles}
    expected_dates = {
        today,
        today + datetime.timedelta(days=1),
        today + datetime.timedelta(days=2),
    }
    assert dates == expected_dates


@patch("app.scripts.generate_puzzles.create_db_and_tables")
@patch("app.scripts.generate_puzzles.get_session")
def test_cli_with_start_and_end_options(
    mock_get_session, mock_create_db, session: Session
):
    """
    GIVEN --start and --end arguments
    WHEN the script is run
    THEN it should generate puzzles for the inclusive date range.
    """
    mock_get_session.return_value = iter([session])
    start_str = "2025-11-01"
    end_str = "2025-11-03"

    result = runner.invoke(app, ["--start", start_str, "--end", end_str])

    assert result.exit_code == 0, result.stdout
    puzzles = session.exec(select(PuzzleWithDate)).all()
    assert len(puzzles) == 3
    dates = {p.date for p in puzzles}
    assert dates == {
        datetime.date(2025, 11, 1),
        datetime.date(2025, 11, 2),
        datetime.date(2025, 11, 3),
    }


@patch("app.scripts.generate_puzzles.create_db_and_tables")
@patch("app.scripts.generate_puzzles.get_session")
def test_cli_with_start_and_days_options(
    mock_get_session, mock_create_db, session: Session
):
    """
    GIVEN --start and --days arguments
    WHEN the script is run
    THEN it should generate puzzles for that many days starting from the start date.
    """
    mock_get_session.return_value = iter([session])
    start_str = "2025-11-10"

    result = runner.invoke(app, ["--start", start_str, "--days", "2"])

    assert result.exit_code == 0, result.stdout
    puzzles = session.exec(select(PuzzleWithDate)).all()
    assert len(puzzles) == 2
    dates = {p.date for p in puzzles}
    assert dates == {datetime.date(2025, 11, 10), datetime.date(2025, 11, 11)}


@patch("app.scripts.generate_puzzles.create_db_and_tables")
@patch("app.scripts.generate_puzzles.get_session")
def test_cli_with_end_and_days_options(
    mock_get_session, mock_create_db, session: Session
):
    """
    GIVEN --end and --days arguments
    WHEN the script is run
    THEN it should generate puzzles for that many days ending on the end date.
    """
    mock_get_session.return_value = iter([session])
    end_str = "2025-11-20"

    result = runner.invoke(app, ["--end", end_str, "--days", "3"])

    assert result.exit_code == 0, result.stdout
    puzzles = session.exec(select(PuzzleWithDate)).all()
    assert len(puzzles) == 3
    dates = {p.date for p in puzzles}
    assert dates == {
        datetime.date(2025, 11, 18),
        datetime.date(2025, 11, 19),
        datetime.date(2025, 11, 20),
    }


@patch("app.scripts.generate_puzzles.create_db_and_tables")
@patch("app.scripts.generate_puzzles.get_session")
def test_cli_is_idempotent(mock_get_session, mock_create_db, session: Session, caplog):
    """
    GIVEN a date range that already has puzzles
    WHEN the script is run a second time for the same range
    THEN it should not create new puzzles and should log skipping messages.
    """
    mock_get_session.side_effect = lambda: iter([session])
    start_str = "2025-12-01"
    end_str = "2025-12-02"

    caplog.set_level(logging.INFO)

    # First run
    result1 = runner.invoke(app, ["--start", start_str, "--end", end_str])
    assert result1.exit_code == 0, result1.stdout
    puzzles1 = session.exec(select(PuzzleWithDate)).all()
    assert len(puzzles1) == 2

    caplog.clear()

    # Second run
    result2 = runner.invoke(app, ["--start", start_str, "--end", end_str])
    assert result2.exit_code == 0, result2.stdout
    puzzles2 = session.exec(select(PuzzleWithDate)).all()
    assert len(puzzles2) == 2  # No new puzzles created

    assert "already exists. Skipping." in caplog.text
    assert caplog.text.count("already exists. Skipping.") == 2
