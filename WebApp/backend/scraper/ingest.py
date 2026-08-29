"""Git 仓库中转：拉取远端 → 读取 inbox JSON → 管道入库 → 归档并提交。

工作流：
1. 外部抓取端（或 CI/GitHub Actions）把消息以 JSON 文件投递到仓库 data/inbox/*.json；
2. 本模块 git pull 拉取最新投递；
3. 逐文件解析 {"items": [...]} 交给 pipeline 入库（幂等，重复执行安全）；
4. 处理完的文件移动到 data/inbox/done/ 并记录到 .processed（重启跳过）；
5. git add/commit/push 归档（push 失败仅告警，不阻断入库）。

消息 JSON 格式（与 pipeline raw 一致）：
    {"items": [{"title": "...", "summary": "...", "content": "...",
                "source_url": "https://...", "domain": "gov.cn",
                "category_ids": [101], "publish_time": "2026-08-27T12:00:00+08:00"}]}
"""
import json
import logging
import shutil
import subprocess
from pathlib import Path

from . import config
from .pipeline import IngestResult, run_once

logger = logging.getLogger(__name__)


def git(repo_dir: Path, *args: str) -> bool:
    """执行 git 命令；失败返回 False（不影响入库主流程）。"""
    try:
        subprocess.run(
            ["git", "-C", str(repo_dir), *args],
            check=True,
            capture_output=True,
            text=True,
            timeout=60,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, TimeoutExpired) as exc:
        logger.warning("git %s 执行失败: %s", args, exc)
        return False


def pull_latest() -> bool:
    """从远端拉取最新投递（失败不阻断，可用本地已有 inbox 文件）。"""
    return git(config.GIT_REPO_DIR, "pull", "--ff-only")


def read_inbox_files() -> list[Path]:
    """收集尚未处理（不在 .processed 记录中）的 inbox JSON 文件。"""
    processed = set()
    if config.PROCESSED_MARK.exists():
        processed = {
            line.strip()
            for line in config.PROCESSED_MARK.read_text(encoding="utf-8").splitlines()
            if line.strip()
        }
    files = sorted(config.INBOX_DIR.glob("*.json"))
    return [f for f in files if f.name not in processed]


def _load_items(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as fh:
        payload = json.load(fh)
    return payload.get("items", [])


def ingest_from_git() -> IngestResult:
    """Git 中转主流程：pull → 逐文件入库 → 归档 + 提交。"""
    pull_latest()

    files = read_inbox_files()
    if not files:
        logger.info("inbox 无新文件，跳过")
        return IngestResult()

    config.DONE_DIR.mkdir(parents=True, exist_ok=True)
    total = IngestResult()
    with open(config.PROCESSED_MARK, "a", encoding="utf-8") as mark:
        for path in files:
            raws = _load_items(path)
            result = run_once(raws)
            logger.info("文件 %s 处理完成: %s", path.name, result.summary)
            # 聚合各文件统计
            total.scanned += result.scanned
            total.added += result.added
            total.skipped_duplicate += result.skipped_duplicate
            total.rejected_low_score += result.rejected_low_score
            total.rejected_source += result.rejected_source
            total.failed += result.failed
            total.rejected_reasons.extend(result.rejected_reasons)
            # 归档：移动到 done/ 并记录处理进度（重复执行/重启均安全）
            shutil.move(str(path), str(config.DONE_DIR / path.name))
            mark.write(path.name + "\n")

    # 提交归档结果回远端（失败仅告警）
    if git(config.GIT_REPO_DIR, "add", "-A") and git(
        config.GIT_REPO_DIR, "commit", "-m", "scraper: ingest inbox messages", "--allow-empty"
    ):
        git(config.GIT_REPO_DIR, "push", "--porcelain")
    return total
