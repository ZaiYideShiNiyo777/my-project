"""数据库连接与会话管理"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类"""


def get_db():
    """FastAPI 依赖：请求级数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
