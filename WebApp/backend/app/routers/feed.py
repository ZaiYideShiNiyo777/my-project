"""GET /api/feed 信息流接口（PRD 8）"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Category, InformationItem, info_category_relation
from ..schemas import FeedItemOut, FeedPageOut, FeedResponse

router = APIRouter(prefix="/api/feed", tags=["feed"])


def _collect_subtree_ids(db: Session, category_id: int) -> set[int]:
    """收集某分类及其全部子分类的 ID（支持无限级嵌套）。"""
    ids = {category_id}
    frontier = {category_id}
    while frontier:
        rows = (
            db.query(Category.id)
            .filter(Category.parent_id.in_(frontier), Category.is_active.is_(True))
            .all()
        )
        frontier = {row[0] for row in rows} - ids
        ids |= frontier
    return ids


def _to_feed_item(row: InformationItem) -> FeedItemOut:
    """ORM 行 -> 输出 Schema（来源名 + 首个分类名）。"""
    first_cat = row.categories[0] if row.categories else None
    return FeedItemOut(
        id=row.id,
        title=row.title,
        summary=row.summary,
        source_url=row.source_url,
        source_name=row.source.source_name if row.source else None,
        credibility_score=float(row.credibility_score),
        publish_time=row.publish_time,
        category_id=first_cat.id if first_cat else None,
        category_name=first_cat.name if first_cat else None,
    )


@router.get("", response_model=FeedResponse)
def get_feed(
    category_id: int = Query(0, description="分类ID，0 表示推荐流"),
    page: int = Query(1, ge=1, description="页码，从 1 开始"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数，默认 20"),
    keyword: Optional[str] = Query(None, description="关键词过滤"),
    db: Session = Depends(get_db),
):
    # 1. 硬性过滤：credibility_score < 0.6 的数据永不返回（PRD 5.4 / 10.3）
    query = db.query(InformationItem).filter(
        InformationItem.credibility_score >= settings.credibility_threshold
    )

    # 2. 分类过滤：0 = 推荐流；否则返回该分类及其全部子分类下的信息
    if category_id > 0:
        subtree = _collect_subtree_ids(db, category_id)
        query = (
            query.join(info_category_relation)
            .filter(info_category_relation.c.category_id.in_(subtree))
            .distinct()
        )

    # 3. 关键词过滤（可选）
    if keyword:
        like = f"%{keyword.strip()}%"
        query = query.filter(
            or_(InformationItem.title.ilike(like), InformationItem.summary.ilike(like))
        )

    total = query.count()
    rows = (
        query.order_by(
            InformationItem.publish_time.desc().nullslast(),
            InformationItem.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [_to_feed_item(row) for row in rows]
    return FeedResponse(data=FeedPageOut(items=items, total=total, page=page))
