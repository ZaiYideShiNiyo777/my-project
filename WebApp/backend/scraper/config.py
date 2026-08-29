"""抓取器配置（可通过环境变量覆盖）"""
import os
from pathlib import Path

# 项目根目录（backend/ 的上一级）
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Git 中转仓库目录：抓取脚本随仓库版本管理，消息以 JSON 形式投递到 inbox/
GIT_REPO_DIR = Path(os.getenv("SCRAPER_GIT_REPO", PROJECT_ROOT))
INBOX_DIR = Path(os.getenv("SCRAPER_INBOX_DIR", PROJECT_ROOT / "data" / "inbox"))
DONE_DIR = INBOX_DIR / "done"
# 处理进度记录：已消费文件清单（追加式），重启后据此跳过已处理的文件
PROCESSED_MARK = INBOX_DIR / ".processed"

# HTTP 采集（RSS/JSON 源）
FETCH_TIMEOUT = float(os.getenv("SCRAPER_FETCH_TIMEOUT", "10"))
FETCH_USER_AGENT = os.getenv(
    "SCRAPER_USER_AGENT",
    "Mozilla/5.0 (compatible; TrustAggregatorBot/1.0; +https://github.com/your/repo)",
)

# 采集源列表：name -> (url, 解析类型 rss|json)
SOURCES: list[dict] = [
    {
        "name": "示例行业源",
        "url": os.getenv("SCRAPER_SAMPLE_FEED", ""),
        "type": "rss",
    },
]

# 调度（APScheduler）
SCHEDULE_INTERVAL = int(os.getenv("SCRAPER_INTERVAL", "300"))  # 秒
