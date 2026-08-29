"""采集器：从 HTTP 源（RSS/JSON）拉取原始条目。

真实源接入示例（在 config.SOURCES 中配置）：
    {"name": "中国政府网要闻", "url": "https://www.gov.cn/.../feed.xml", "type": "rss"}

采集结果统一为 raw dict 列表，交由 pipeline 处理：
    {
        "title": str,
        "summary": str | None,
        "content": str | None,      # 清洗前正文（HTML 亦可）
        "source_url": str,          # 唯一标识，用于增量去重
        "domain": str,              # 来源域名，白名单校验用
        "category_ids": list[int],  # 关联的二级分类 id（多对多）
        "publish_time": str | None, # ISO 时间
    }
"""
import logging
import re
from typing import Iterator
from urllib.parse import urlparse

import httpx

from . import config

logger = logging.getLogger(__name__)


def fetch_feed(url: str, feed_type: str = "rss") -> Iterator[dict]:
    """拉取单个源并产出 raw 条目。

    骨架实现：rss 类型解析 <item> 标题/链接/描述；
    实际部署可按源实现 XML/JSON 解析，或直接改用 Git inbox 投递（推荐）。
    """
    if not url:
        logger.info("源 URL 为空，跳过 HTTP 采集")
        return
    try:
        resp = httpx.get(
            url,
            timeout=config.FETCH_TIMEOUT,
            headers={"User-Agent": config.FETCH_USER_AGENT},
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.error("采集失败 url=%s err=%s", url, exc)
        return

    if feed_type == "rss":
        yield from _parse_rss_items(resp.text)
    else:
        yield from _parse_json_items(resp.json())


def _parse_rss_items(xml_text: str) -> Iterator[dict]:
    """极简 RSS 解析（无第三方依赖）；按需可替换为 feedparser。"""
    for item in xml_text.split("<item>")[1:]:
        def pick(tag: str) -> str:
            m = re.search(fr"<{tag}[^>]*>(.*?)</{tag}>", item, re.S)
            return re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""

        title = pick("title")
        link = pick("link")
        if not title or not link:
            continue
        yield {
            "title": title,
            "summary": pick("description") or None,
            "content": None,
            "source_url": link,
            "domain": urlparse(link).netloc,
            "category_ids": [],
            "publish_time": None,
        }


def _parse_json_items(payload: dict) -> Iterator[dict]:
    """JSON 源：支持 {"items": [...]} 包裹。"""
    for item in payload.get("items", []):
        yield item


def fetch_all() -> Iterator[dict]:
    """遍历全部配置源，聚合 raw 条目。"""
    for source in config.SOURCES:
        yield from fetch_feed(source.get("url", ""), source.get("type", "rss"))
