from functools import cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DB_FILE_PATH = Path(__file__).parent / "database.db"


class Settings(BaseSettings):
    # The default value will be used if the environment variable is not set.
    database_url: str = f"sqlite:///{DEFAULT_DB_FILE_PATH}"
    # For SQLite, we need to add connect_args. This is not needed for other DBs.
    database_connect_args: dict = {"check_same_thread": False}

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@cache
def get_settings():
    return Settings()
