"""GET /api/categories/tree 分类树接口（PRD 8）"""
import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Category
from ..schemas import CategoryNodeOut, CategoryTreeResponse
from ..services.cache import get_redis

router = APIRouter(prefix="/api/categories", tags=["categories"])

TREE_CACHE_KEY = "categories:tree"


def _build_tree(rows: list[Category]) -> list[CategoryNodeOut]:
    """按 parent_id 组装无限级树（保留 sort_order 顺序）。"""
    nodes: dict[int, CategoryNodeOut] = {
        row.id: CategoryNodeOut(
            id=row.id, name=row.name, icon_name=row.icon_name, children=[]
        )
        for row in rows
    }
    roots: list[CategoryNodeOut] = []
    for row in rows:
        node = nodes[row.id]
        parent = nodes.get(row.parent_id or 0)
        if parent is not None and parent.id != node.id:
            parent.children.append(node)
        else:
            roots.append(node)
    return roots


@router.get("/tree", response_model=CategoryTreeResponse)
def get_category_tree(db: Session = Depends(get_db)):
    cache = get_redis()

    # 1. 命中缓存直接返回
    if cache is not None:
        cached = cache.get(TREE_CACHE_KEY)
        if cached:
            payload = json.loads(cached)
            tree = [CategoryNodeOut.model_validate(item) for item in payload]
            return CategoryTreeResponse(data=tree)

    # 2. 查库并组装树（仅启用分类，按 sort_order 排序）
    rows = (
        db.query(Category)
        .filter(Category.is_active.is_(True))
        .order_by(Category.sort_order, Category.id)
        .all()
    )
    tree = _build_tree(rows)

    # 3. 回写缓存（Redis 不可用时已降级为不缓存）
    if cache is not None:
        payload = json.dumps(
            [node.model_dump() for node in tree], ensure_ascii=False
        )
        cache.setex(TREE_CACHE_KEY, 600, payload)

    return CategoryTreeResponse(data=tree)
