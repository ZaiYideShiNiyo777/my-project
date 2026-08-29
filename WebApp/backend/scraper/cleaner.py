"""正文清洗：去 HTML 标签/脚本/广告噪音，输出纯文本。"""
import html
import re

# 需剔除的噪音块（广告/导航/免责声明等）
_NOISE_PATTERNS = [
    re.compile(r"<script[\s\S]*?</script>", re.I),
    re.compile(r"<style[\s\S]*?</style>", re.I),
    re.compile(r"<!--[\s\S]*?-->"),
    re.compile(r"(免责声明|广告|推广|点击查看原文)[^。！？]*[。！？]"),
]

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def clean_html(raw: str | None) -> str:
    """HTML 正文 → 纯文本（去标签、去噪音、压缩空白）。"""
    if not raw:
        return ""
    text = raw
    for pat in _NOISE_PATTERNS:
        text = pat.sub(" ", text)
    text = _TAG_RE.sub(" ", text)
    text = html.unescape(text)
    text = _WS_RE.sub(" ", text)
    return text.strip()


def clean_text(raw: str | None) -> str:
    """纯文本正文：仅压缩空白（无 HTML 时使用）。"""
    if not raw:
        return ""
    return _WS_RE.sub(" ", raw).strip()
