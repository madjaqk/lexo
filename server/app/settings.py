from functools import cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).parent.parent
DEFAULT_DB_FILE_PATH = PROJECT_ROOT / "data" / "db.sqlite3"


class Settings(BaseSettings):
    # The default value will be used if the environment variable is not set.
    database_url: str = f"sqlite:///{DEFAULT_DB_FILE_PATH}"
    # For SQLite, we need to add connect_args. This is not needed for other DBs.
    database_connect_args: dict = {"check_same_thread": False}
    config_directory: Path = PROJECT_ROOT / "config"
    puzzle_generation_salt: str = "default-salt-for-dev"
    environment: Literal["dev", "prod"] = "dev"


@cache
def get_settings():
    return Settings()
