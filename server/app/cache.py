from functools import cache
from typing import Annotated

import redis
from fastapi import Depends

from app.settings import get_settings


@cache
def get_redis_client() -> redis.Redis | None:
    settings = get_settings()
    if settings.redis_url:
        return redis.Redis.from_url(settings.redis_url, decode_responses=True)
    return None


RedisDep = Annotated[redis.Redis | None, Depends(get_redis_client)]
