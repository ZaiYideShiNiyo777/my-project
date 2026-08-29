"""Redis 热点缓存（PRD 3：Redis 缓存热点数据）

Redis 不可用时自动降级为不缓存，保证接口可用性。
"""
import redis

from ..config import settings

_client: redis.Redis | None = None


def get_redis() -> redis.Redis | None:
    """获取全局 Redis 客户端；连接失败返回 None（降级模式）。"""
    global _client
    if _client is None:
        try:
            _client = redis.Redis.from_url(
                settings.redis_url, decode_responses=True, socket_timeout=2
            )
            _client.ping()
        except redis.RedisError:
            _client = None  # 降级：不缓存，直接查库
    return _client
