import json
from typing import Generator

from fastapi.encoders import jsonable_encoder
from sqlmodel import SQLModel, Session, create_engine

from .settings import get_settings

settings = get_settings()


# Custom serializer to handle Pydantic/SQLModel objects when writing to JSON columns
def custom_serializer(obj):
    return json.dumps(jsonable_encoder(obj))


engine = create_engine(
    settings.database_url,
    connect_args=settings.database_connect_args,
    json_serializer=custom_serializer,
)


def create_db_and_tables():
    """
    Creates the database and all tables defined by SQLModel models.
    This function is called on application startup.
    """
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency to create and yield a database session.
    """
    with Session(engine) as session:
        yield session
