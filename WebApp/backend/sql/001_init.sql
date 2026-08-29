-- 001_init.sql：核心数据库 DDL 迁移（PRD 4 Schema）
-- 执行：psql -U postgres -d trust_aggregator -f 001_init.sql

-- 1. 动态分类表（支持无限级，覆盖全行业）
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER DEFAULT 0,        -- 0表示顶级根节点
    sort_order INTEGER DEFAULT 0,
    icon_name VARCHAR(50),              -- 存储Lucide图标字符串，如 'Cpu'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. 可信数据源白名单（第一道防线）
CREATE TABLE IF NOT EXISTS trusted_sources (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL, -- 如 'gov.cn', 'reuters.com'
    source_name VARCHAR(100),
    industry_id INTEGER REFERENCES categories(id), -- 关联行业
    trust_score DECIMAL(3,2) DEFAULT 0.95, -- 基础信誉分
    is_verified BOOLEAN DEFAULT TRUE
);

-- 3. 信息主表
CREATE TABLE IF NOT EXISTS information_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content TEXT,                       -- 清洗后的纯文本
    source_url VARCHAR(500) UNIQUE,
    source_id INTEGER REFERENCES trusted_sources(id),
    -- 可信度计算相关
    credibility_score DECIMAL(3,2) DEFAULT 0.00, -- 综合评分 <0.6 自动过滤不展示
    publish_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 信息与分类关联（多对多）
CREATE TABLE IF NOT EXISTS info_category_relation (
    info_id INTEGER REFERENCES information_items(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (info_id, category_id)
);

-- 查询索引（信息流按时间倒序 + 可信度过滤）
CREATE INDEX IF NOT EXISTS idx_items_credibility ON information_items (credibility_score);
CREATE INDEX IF NOT EXISTS idx_items_publish_time ON information_items (publish_time);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories (parent_id);
