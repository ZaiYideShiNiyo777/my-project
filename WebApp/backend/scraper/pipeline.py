"""抓取管道：采集 → 正文清洗 → 复用 credibility 三级过滤 → 增量去重 → 幂等入库。

入库规则（PRD 5.4 / 10.3）：
1. 源域名不在白名单（trusted_sources）→ 拒绝；
2. credibility_score < 0.6（来源分 × 内容分 × 链接分）→ 拒绝入库；
3. source_url 已存在 → 跳过（增量去重，接口幂等可重复执行）。
"""
import logging
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Iterable

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Category, InformationItem, TrustedSource
from app.services.credibility import (
    compute_credibility,
    is_credible,
    source_block,
)

from .cleaner import clean_html, clean_text

logger = logging.getLogger(__name__)


@dataclass
class IngestResult:
    """一轮抓取的统计结果。"""

    scanned: int = 0
    added: int = 0
    skipped_duplicate: int = 0
    rejected_low_score: int = 0
    rejected_source: int = 0
    failed: int = 0
    rejected_reasons: list[str] = field(default_factory=list)

    @property
    def summary(self) -> str:
        return (
            f"扫描={self.scanned} 入库={self.added} 重复跳过={self.skipped_duplicate} "
            f"低分拒绝={self.rejected_low_score} 非白名单拒绝={self.rejected_source} "
            f"失败={self.failed}"
        )


def load_whitelist(db: Session) -> dict[str, TrustedSource]:
    """加载白名单域名 -> 数据源对象（抓取时从库中读取，保证与种子数据一致）。"""
    return {s.domain: s for s in db.query(TrustedSource).all()}


def load_existing_urls(db: Session) -> set[str]:
    """已入库 URL 集合（增量去重）。"""
    return {row[0] for row in db.query(InformationItem.source_url).all() if row[0]}


def ingest_raw_items(db: Session, raws: Iterable[dict]) -> IngestResult:
    """将 raw 条目跑完整管道并入库（幂等：重复执行不产生重复数据）。"""
    result = IngestResult()
    whitelist = load_whitelist(db)
    whitelist_domains = set(whitelist)
    existing = load_existing_urls(db)
    # 本轮新增的 URL 也视为已存在（同一轮内去重）
    seen_this_round: set[str] = set()

    for raw in raws:
        result.scanned += 1
        try:
            _ingest_one(db, raw, whitelist, whitelist_domains, existing, seen_this_round, result)
        except Exception as exc:  # 单条失败不中断整轮
            result.failed += 1
            result.rejected_reasons.append(f"{raw.get('title', '?')[:20]}...: {exc}")
            logger.exception("单条入库失败: %s", raw.get("title", "?"))

    db.commit()
    return result


def _ingest_one(
    db: Session,
    raw: dict,
    whitelist: dict[str, TrustedSource],
    whitelist_domains: set[str],
    existing: set[str],
    seen_this_round: set[str],
    result: IngestResult,
) -> None:
    title = (raw.get("title") or "").strip()
    source_url = (raw.get("source_url") or "").strip()
    if not title or not source_url:
        result.failed += 1
        result.rejected_reasons.append("缺少 title/source_url")
        return

    domain = (raw.get("domain") or "").strip().lower()
    # 第一道防线：白名单校验（与 credibility.source_block 一致）
    if not source_block(domain, whitelist_domains):
        result.rejected_source += 1
        result.rejected_reasons.append(f"非白名单域名: {domain}")
        return

    # 正文清洗（HTML 或纯文本）
    content = clean_html(raw.get("content")) or clean_text(raw.get("content"))
    text = content or clean_text(raw.get("summary")) or title

    # 第二、三道防线：三级过滤计算综合可信度（复用 app/services/credibility.py）
    source = whitelist[domain]
    score = compute_credibility(
        source.trust_score, text, [source_url], whitelist_domains
    )
    if not is_credible(score):
        result.rejected_low_score += 1
        result.rejected_reasons.append(
            f"低分拒绝({score}): {title[:24]}"
        )
        return

    # 增量去重：source_url 唯一（数据库 UNIQUE 兜底，幂等安全）
    if source_url in existing or source_url in seen_this_round:
        result.skipped_duplicate += 1
        return

    # 分类关联（仅挂有效的分类 id）
    cat_ids: list[int] = [c for c in raw.get("category_ids") or [] if c]
    categories = []
    if cat_ids:
        categories = [c for c in db.query(Category).filter(Category.id.in_(cat_ids)).all()]

    publish_time = None
    if raw.get("publish_time"):
        try:
            publish_time = datetime.fromisoformat(str(raw["publish_time"]).replace("Z", "+00:00"))
        except ValueError:
            publish_time = None

    item = InformationItem(
        title=title,
        summary=clean_text(raw.get("summary")) or content[:200] or None,
        content=content or None,
        source_url=source_url,
        source_id=source.id,
        credibility_score=Decimal(str(score)),
        publish_time=publish_time,
    )
    item.categories = categories
    db.add(item)
    seen_this_round.add(source_url)
    existing.add(source_url)
    result.added += 1
    logger.info("入库: %s (score=%s, cats=%s)", title[:24], score, cat_ids)


def run_once(raws: Iterable[dict]) -> IngestResult:
    """独立执行一轮管道（自建会话）。"""
    db: Session = SessionLocal()
    try:
        return ingest_raw_items(db, raws)
    finally:
        db.close()
