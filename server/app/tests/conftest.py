import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.database import custom_serializer, get_session
from app.main import app


@pytest.fixture(name="session")
def session_fixture():
    """
    Pytest fixture to create a new in-memory database and session for each test.
    This is useful for tests that need to interact with the database directly,
    independent of the FastAPI app.
    """
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        json_serializer=custom_serializer,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """
    Pytest fixture that provides a test client for making HTTP requests to the app.
    It uses an in-memory SQLite database that is created and destroyed for each test.
    """

    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
