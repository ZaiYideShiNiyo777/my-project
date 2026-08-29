FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
# 腾讯云构建环境使用腾讯云 PyPI 镜像（清华源在腾讯云构建会 403）
RUN pip install --no-cache-dir -r requirements.txt -i https://mirrors.cloud.tencent.com/pypi/simple

COPY app ./app
COPY scraper ./scraper
# Git inbox 投递目录（随镜像打包，容器内 daemon 消费）
COPY data ./data

EXPOSE 8000

# 启动顺序：建表+Seed（幂等）→ 后台抓取调度器（每 300s，含 HTTP 源）→ 前台 API
CMD ["sh", "-c", "python -m app.seed && (python -m scraper.run --daemon --interval 300 --http &) && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
