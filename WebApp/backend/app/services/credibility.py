"""信息真实度过滤逻辑（PRD 5 三级过滤 Pipeline）

采集服务入库前调用 compute_credibility() 计算综合评分，
低于阈值（0.6）的数据禁止入库展示（PRD 5.4 / 10.3）。
"""
import re
from decimal import Decimal
from typing import Iterable, Protocol, Sequence

from ..config import settings


class InformationItemLike(Protocol):
    """带可信度字段的对象（ORM 行或字典均可）"""

    credibility_score: Decimal | float

# 极端情绪词（命中扣分）
EMOTION_WORDS = [
    "震惊", "怒赞", "炸了", "疯传", "吓人", "秒删", "紧急", "突发重磅",
    "全网沸腾", "不可思议", "恐怖如斯",
]

# 绝对化断言模式（命中扣分，如“100%赚钱”“稳赚不赔”）
ABSOLUTE_PATTERNS = [
    r"100%赚钱", r"稳赚不赔", r"稳赚", r"必涨", r"必跌", r"绝对没问题",
    r"包治百病", r"永不失效", r"百分百",
]

# 正文最低字数（PRD 5.2：字数 > 100 才算完整；抓取场景放宽至 60，0.6 阈值不变）
MIN_TEXT_LENGTH = 60


def source_block(domain: str, whitelist: Iterable[str]) -> bool:
    """第一道防线：源头屏蔽。

    采集器只允许抓取白名单（trusted_sources）中的域名，其余直接丢弃。
    返回 True 表示允许抓取。
    """
    return any(
        domain == wl or domain.endswith(f".{wl}") for wl in whitelist
    )


def _analyze_text(text: str) -> float:
    """NLP 内容分析：完整性 + 极端情绪词 / 绝对化断言扣分。"""
    score = 1.0
    if len(text) <= MIN_TEXT_LENGTH:
        score -= 0.15  # 内容不完整
    for word in EMOTION_WORDS:
        if word in text:
            score -= 0.05
            break
    for pattern in ABSOLUTE_PATTERNS:
        if re.search(pattern, text):
            score -= 0.25  # 绝对化断言（100%赚钱/稳赚不赔等）违背事实，重扣
            break
    return max(score, 0.0)


def _analyze_links(links: Sequence[str], whitelist: Iterable[str]) -> float:
    """链接分析：超过 50% 外部链接指向低信誉（非白名单）网站则扣分。"""
    if not links:
        return 1.0
    whitelist_set = set(whitelist)
    low_trust = sum(
        1
        for url in links
        if not any(wl in url for wl in whitelist_set)
    )
    if low_trust / len(links) > 0.5:
        return 0.5
    return 1.0


def compute_credibility(
    source_trust_score: Decimal | float,
    text: str,
    links: Sequence[str] | None = None,
    whitelist: Iterable[str] | None = None,
) -> Decimal:
    """综合信誉评分 = 来源基础分 × 内容分 × 链接分（PRD 5）。"""
    base = float(source_trust_score)
    content = _analyze_text(text)
    link = _analyze_links(links or [], whitelist or [])
    total = round(base * content * link, 2)
    return Decimal(str(total))


def is_credible(score: Decimal | float) -> bool:
    """最终阈值判断（PRD 5.4）：低于 0.6 禁止展示。"""
    return float(score) >= settings.credibility_threshold


def filter_items(items: Sequence[InformationItemLike]) -> list:
    """入库前置过滤：score < 0.6 的数据一律不进入展示链路（PRD 10.3）。"""
    return [item for item in items if is_credible(item.credibility_score)]
