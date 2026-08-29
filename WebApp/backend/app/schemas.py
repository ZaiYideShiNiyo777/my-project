"""Pydantic Schema（API 出入参）"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ---------- 统一响应包裹 ----------
class ApiResponse(BaseModel):
    code: int = 0
    message: str = "ok"


# ---------- 分类树 ----------
class CategoryNodeOut(BaseModel):
    """分类树节点：id, name, icon_name, children（PRD 8）"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon_name: Optional[str] = None
    children: List["CategoryNodeOut"] = []


class CategoryTreeResponse(ApiResponse):
    data: List[CategoryNodeOut]


# ---------- 信息流 ----------
class FeedItemOut(BaseModel):
    """信息流条目，必须包含 credibility_score（PRD 8）"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    summary: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    credibility_score: float
    publish_time: Optional[datetime] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None


class FeedPageOut(BaseModel):
    items: List[FeedItemOut]
    total: int
    page: int


class FeedResponse(ApiResponse):
    data: FeedPageOut
