"""实时抓取模块：Git 仓库中转 + 采集 → 清洗 → 可信度过滤 → 增量去重 → 幂等入库。

运行方式（backend 目录下）：
    python -m scraper.run --once                 # 手动执行一轮
    python -m scraper.run --daemon --interval 300  # APScheduler 定时循环
"""
