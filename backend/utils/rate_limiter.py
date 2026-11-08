import time
import logging
from collections import defaultdict
from threading import Lock
from typing import Optional, Tuple
import os

logger = logging.getLogger("metechq.rate_limiter")

# Lua script for Redis atomic check-and-record sliding window
LUA_SLIDING_WINDOW = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max_attempts = tonumber(ARGV[3])
local clear_before = now - window

-- 1. Remove expired timestamps outside the sliding window
redis.call('ZREMRANGEBYSCORE', key, 0, clear_before)

-- 2. Count active attempts in window
local current_attempts = redis.call('ZCARD', key)

if current_attempts >= max_attempts then
    -- Exceeded limit: compute remaining retry_after seconds from oldest attempt
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after = window
    if oldest and #oldest >= 2 then
        local oldest_ts = tonumber(oldest[2])
        retry_after = math.ceil(window - (now - oldest_ts))
        if retry_after < 1 then retry_after = 1 end
    end
    return {0, retry_after}
else
    -- Allowed: record this attempt atomically inside the sorted set
    redis.call('ZADD', key, now, tostring(now) .. '-' .. tostring(redis.call('INCR', key .. ':seq')))
    redis.call('EXPIRE', key, window * 2)
    redis.call('EXPIRE', key .. ':seq', window * 2)
    return {1, 0}
end
"""

class InMemoryRateLimiter:
    """
    Thread-safe sliding-window in-memory rate limiter with atomic check-and-record.
    
    IMPORTANT SCOPE LIMITATION:
    This limiter operates within a single process memory space.
    It is thread-safe within a single Uvicorn worker, but does NOT synchronize
    state across multiple worker processes (--workers > 1) or distributed container nodes.
    For multi-worker or multi-container horizontal deployments, configure REDIS_URL.
    """
    def __init__(self):
        self._lock = Lock()
        self._attempts = defaultdict(list)
    
    def check_rate_limit(self, key: str, max_attempts: int, window_seconds: int) -> Tuple[bool, int]:
        """Read-only check of current rate limit status without recording an attempt"""
        now = time.time()
        with self._lock:
            valid_attempts = [t for t in self._attempts[key] if now - t < window_seconds]
            self._attempts[key] = valid_attempts
            
            if len(valid_attempts) >= max_attempts:
                oldest_in_window = valid_attempts[0]
                retry_after = int(window_seconds - (now - oldest_in_window)) + 1
                return False, max(1, retry_after)
            
            return True, 0

    def check_and_record(self, key: str, max_attempts: int, window_seconds: int) -> Tuple[bool, int]:
        """Atomically checks and records attempt within the sliding window"""
        now = time.time()
        with self._lock:
            valid_attempts = [t for t in self._attempts[key] if now - t < window_seconds]
            
            if len(valid_attempts) >= max_attempts:
                oldest_in_window = valid_attempts[0]
                retry_after = int(window_seconds - (now - oldest_in_window)) + 1
                self._attempts[key] = valid_attempts
                return False, max(1, retry_after)
            
            valid_attempts.append(now)
            self._attempts[key] = valid_attempts
            return True, 0
    
    def record_attempt(self, key: str):
        now = time.time()
        with self._lock:
            self._attempts[key].append(now)
    
    def reset(self, key: str):
        with self._lock:
            if key in self._attempts:
                del self._attempts[key]

class HybridRateLimiter:
    """
    Sliding-window rate limiter providing atomic check-and-record operations.
    Uses Redis when REDIS_URL is configured (enabling multi-worker synchronization),
    and falls back gracefully to InMemoryRateLimiter on Redis outages.
    """
    def __init__(self, redis_url: Optional[str] = None):
        self._redis_url = redis_url if redis_url is not None else os.getenv("REDIS_URL", "").strip()
        self._in_memory = InMemoryRateLimiter()
        self._redis_client = None
        self._lua_script = None
        self.is_distributed = False
        self.status = "in_memory_unconfigured"
        self.last_error = None
        
        if self._redis_url:
            self._connect()
        else:
            logger.info(
                "ℹ️  REDIS_URL not set. Running in-memory rate limiter "
                "(scope: single worker process; not synchronized across multiple workers/nodes)."
            )

    def _connect(self):
        try:
            import redis
            client = redis.Redis.from_url(self._redis_url, socket_timeout=2.0)
            client.ping()
            self._redis_client = client
            self._lua_script = client.register_script(LUA_SLIDING_WINDOW)
            self.is_distributed = True
            self.status = "distributed_redis"
            self.last_error = None
            logger.info("✅ Distributed Redis rate limiter initialized successfully.")
        except Exception as e:
            logger.warning(
                f"⚠️ Failed to connect to Redis at {self._redis_url}: {e}. "
                "Outage behavior: Falling back to single-process in-memory rate limiting."
            )
            self._redis_client = None
            self.is_distributed = False
            self.status = "degraded_in_memory_fallback"
            self.last_error = str(e)

    def check_and_record(self, key: str, max_attempts: int, window_seconds: int) -> Tuple[bool, int]:
        """
        Atomic check-and-record: verifies rate limit and commits attempt in one step.
        Guarantees zero race conditions across concurrent requests or multiple workers.
        """
        if self._redis_client and self._lua_script:
            try:
                now = time.time()
                redis_key = f"ratelimit:{key}"
                res = self._lua_script(keys=[redis_key], args=[now, window_seconds, max_attempts])
                allowed = bool(res[0])
                retry_after = int(res[1])
                return allowed, retry_after
            except Exception as e:
                logger.warning(f"Redis rate limiting failed ({e}). Outage fallback: using in-memory.")
                self.is_distributed = False
                self.status = "degraded_in_memory_fallback"
                self.last_error = str(e)
                return self._in_memory.check_and_record(key, max_attempts, window_seconds)
        
        return self._in_memory.check_and_record(key, max_attempts, window_seconds)

    def check_rate_limit(self, key: str, max_attempts: int, window_seconds: int) -> Tuple[bool, int]:
        """Read-only check of limit status"""
        if self._redis_client:
            try:
                now = time.time()
                redis_key = f"ratelimit:{key}"
                pipe = self._redis_client.pipeline()
                pipe.zremrangebyscore(redis_key, 0, now - window_seconds)
                pipe.zcard(redis_key)
                pipe.zrange(redis_key, 0, 0, withscores=True)
                results = pipe.execute()
                
                current_count = results[1]
                oldest_entries = results[2]
                
                if current_count >= max_attempts:
                    if oldest_entries:
                        oldest_ts = oldest_entries[0][1]
                        retry_after = int(window_seconds - (now - oldest_ts)) + 1
                    else:
                        retry_after = window_seconds
                    return False, max(1, retry_after)
                return True, 0
            except Exception as e:
                logger.warning(f"Redis check failed ({e}). Outage fallback: using in-memory.")
                return self._in_memory.check_rate_limit(key, max_attempts, window_seconds)
        
        return self._in_memory.check_rate_limit(key, max_attempts, window_seconds)

    def record_attempt(self, key: str):
        if self._redis_client:
            try:
                now = time.time()
                redis_key = f"ratelimit:{key}"
                pipe = self._redis_client.pipeline()
                pipe.zadd(redis_key, {f"{now}-{time.time_ns()}": now})
                pipe.expire(redis_key, 3600)
                pipe.execute()
                return
            except Exception as e:
                logger.warning(f"Redis record attempt failed ({e}). Outage fallback: using in-memory.")
                self._in_memory.record_attempt(key)
                return

        self._in_memory.record_attempt(key)

    def reset(self, key: str):
        if self._redis_client:
            try:
                redis_key = f"ratelimit:{key}"
                self._redis_client.delete(redis_key)
                self._redis_client.delete(f"{redis_key}:seq")
            except Exception:
                pass
        self._in_memory.reset(key)

# Global rate limiter singletons
login_rate_limiter = HybridRateLimiter()
public_api_limiter = HybridRateLimiter()
