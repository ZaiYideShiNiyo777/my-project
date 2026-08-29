"""FastAPI 应用入口（全行业可信信息聚合平台）"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import categories, feed


@asynccontextmanager
async def lifespan(_: FastAPI):
    # 开发环境自动建表；生产环境请使用 Alembic 迁移（sql/001_init.sql）
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="全行业可信信息聚合平台 API",
    description="移动端极简暗色版 Web App 后端（PRD v1.0）",
    version="1.0.0",
    lifespan=lifespan,
)

# 移动端 Web App 跨域（生产由 Nginx 同域反代，可收紧）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(feed.router)
app.include_router(categories.router)


@app.get("/api/health")
def health():
    return {"code": 0, "message": "ok", "data": {"status": "up"}}
