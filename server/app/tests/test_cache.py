from unittest import mock

import pytest
import redis

from app.cache import get_redis_client
from app.settings import Settings


@pytest.fixture(autouse=True)
def clear_get_redis_client_cache():
    """Fixture to clear the cache for get_redis_client before and after each test."""
    get_redis_client.cache_clear()
    yield
    get_redis_client.cache_clear()


def test_get_redis_client_with_redis_url():
    """WHEN the settings contain a redis_url
    THEN get_redis_client should return a redis.Redis instance.
    """
    with mock.patch(
        "app.cache.get_settings", return_value=Settings(redis_url="redis://localhost:6379/0")
    ):
        client = get_redis_client()
        assert client is not None
        assert isinstance(client, redis.Redis)


def test_get_redis_client_without_redis_url():
    """WHEN the settings do not contain a redis_url
    THEN get_redis_client should return None.
    """
    with mock.patch("app.cache.get_settings", return_value=Settings(redis_url=None)):
        client = get_redis_client()
        assert client is None
