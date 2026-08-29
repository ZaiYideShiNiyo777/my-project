"""抓取调度入口。

用法（backend 目录下）：
    python -m scraper.run --once                        # 手动执行一轮
    python -m scraper.run --daemon --interval 300       # APScheduler 定时循环（秒）
    python -m scraper.run --daemon --interval 300 --http # 同时启用 HTTP 采集源

触发机制：
- 定时：APScheduler（本文件 --daemon）或 cron（每 5 分钟执行一次 --once）；
- Git 事件：GitHub Actions / webhook 在 push 后执行 python -m scraper.run --once；
- 幂等：重复执行 / 重启 / 多实例并发均安全（URL 去重 + .processed 进度记录）。
"""
import argparse
import logging
import sys

from apscheduler.schedulers.blocking import BlockingScheduler

from . import config
from .fetcher import fetch_all
from .ingest import ingest_from_git
from .pipeline import run_once

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("scraper.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("scraper.run")


def run_one_round(with_http: bool = False):
    """执行一轮完整抓取：Git inbox + 可选 HTTP 源。"""
    logger.info("=== 开始一轮抓取 ===")
    # 1. Git 仓库中转（推荐投递通道）
    total = ingest_from_git()
    logger.info("Git inbox: %s", total.summary)
    # 2. HTTP 源直采（可选）
    if with_http:
        http_result = run_once(fetch_all())
        logger.info("HTTP 源: %s", http_result.summary)
    logger.info("=== 本轮抓取结束 ===")
    return total


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="可信信息聚合平台 - 实时抓取器")
    parser.add_argument("--once", action="store_true", help="仅执行一轮后退出")
    parser.add_argument("--daemon", action="store_true", help="以守护模式定时执行")
    parser.add_argument(
        "--interval", type=int, default=config.SCHEDULE_INTERVAL, help="定时间隔（秒）"
    )
    parser.add_argument("--http", action="store_true", help="同时启用 HTTP 采集源")
    args = parser.parse_args(argv)

    if args.once:
        run_one_round(args.http)
        return 0
    if args.daemon:
        logger.info("守护模式启动，间隔 %s 秒", args.interval)
        scheduler = BlockingScheduler()
        scheduler.add_job(
            run_one_round, "interval", seconds=args.interval, args=[args.http]
        )
        try:
            scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            logger.info("调度器已停止")
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
