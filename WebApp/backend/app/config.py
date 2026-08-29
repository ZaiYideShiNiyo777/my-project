"""应用配置（通过环境变量 / .env 覆盖）"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL 业务库
    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/trust_aggregator"
    )
    # Redis 热点缓存
    redis_url: str = "redis://localhost:6379/0"
    # 分类树缓存 TTL（秒）
    category_tree_cache_ttl: int = 600
    # 可信度阈值：低于该值的数据禁止入库展示（PRD 5.4）
    credibility_threshold: float = 0.6

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
