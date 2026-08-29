# data/inbox/：Git 中转投递目录

将待入库消息以 JSON 文件放入本目录并 push 到 Git 仓库，后端抓取器（`python -m scraper.run --once`）会自动：
1. `git pull` 拉取投递；
2. 解析 `{"items": [...]}` 跑完整管道（白名单校验 → 正文清洗 → 可信度三级过滤 → 增量去重 → 幂等入库）；
3. 处理完的文件移动到 `data/inbox/done/`，并记录到 `.processed`（重启/重复执行均安全）。

消息格式参考 `examples/sample.json`。格式说明：
- `source_url`：唯一标识，用于增量去重（重复投递自动跳过）
- `domain`：来源域名，必须命中后端 `trusted_sources` 白名单，否则拒绝
- `category_ids`：关联的二级分类 id（支持多对多，如 [1301, 1302]）
- `publish_time`：ISO 8601 时间，可选

触发方式（任选其一）：
- 定时：`python -m scraper.run --daemon --interval 300`
- cron：每 5 分钟执行 `python -m scraper.run --once`
- Git 事件：GitHub Actions / webhook 在 push 后执行 `--once`
