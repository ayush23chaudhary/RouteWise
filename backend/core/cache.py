import hashlib
import json
import logging
from typing import Optional, Dict, Any
from domain.value_objects.coordinates import Coordinates

logger = logging.getLogger("core.cache")

def build_route_cache_key(coordinates: list[Coordinates]) -> str:
    """
    Generates a deterministic MD5 cache key string based on ordered coordinate pairs.
    Format: route_cache:<md5_hash>
    """
    coord_str = "|".join(f"{round(c.latitude, 4)},{round(c.longitude, 4)}" for c in coordinates)
    hashed = hashlib.md5(coord_str.encode("utf-8")).hexdigest()
    return f"route_cache:{hashed}"


class RouteCacheManager:
    """
    Cache abstraction manager integrating with Django Cache / Redis with in-memory fallback.
    Provides route geometry lookups with graceful fallback if Redis/Django is unavailable.
    """
    DEFAULT_TTL_SECONDS = 86400  # 24 Hours
    _in_memory_store: Dict[str, dict] = {}

    def get(self, cache_key: str) -> Optional[dict]:
        """Attempts to read route result dictionary from cache."""
        try:
            from django.core.cache import cache
            cached_val = cache.get(cache_key)
            if cached_val:
                logger.info(f"Cache HIT (Django/Redis) for key: {cache_key}")
                return json.loads(cached_val) if isinstance(cached_val, str) else cached_val
        except Exception:
            # Fallback to process in-memory store
            if cache_key in self._in_memory_store:
                logger.info(f"Cache HIT (In-Memory) for key: {cache_key}")
                return self._in_memory_store[cache_key]

        return None

    def set(self, cache_key: str, data: dict, timeout: int = DEFAULT_TTL_SECONDS) -> None:
        """Writes route result dictionary to cache with TTL."""
        try:
            from django.core.cache import cache
            cache.set(cache_key, data, timeout=timeout)
            logger.info(f"Cache WRITE (Django/Redis) for key: {cache_key} (TTL: {timeout}s)")
        except Exception:
            self._in_memory_store[cache_key] = data
            logger.info(f"Cache WRITE (In-Memory) for key: {cache_key}")
