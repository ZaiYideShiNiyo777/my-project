"""ORM 模型（对应 PRD 4 的 4 张表）"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# 4. 信息与分类关联（多对多）
info_category_relation = Table(
    "info_category_relation",
    Base.metadata,
    Column(
        "info_id",
        ForeignKey("information_items.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "category_id",
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Category(Base):
    """1. 动态分类表（parent_id=0 表示顶级根节点，支持无限级嵌套）"""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_id: Mapped[int] = mapped_column(Integer, default=0, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    icon_name: Mapped[str | None] = mapped_column(String(50))  # Lucide 图标名
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TrustedSource(Base):
    """2. 可信数据源白名单（第一道防线）"""

    __tablename__ = "trusted_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    domain: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    source_name: Mapped[str | None] = mapped_column(String(100))
    industry_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id")
    )
    trust_score: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), default=Decimal("0.95")
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)


class InformationItem(Base):
    """3. 信息主表（credibility_score < 0.6 禁止入库展示）"""

    __tablename__ = "information_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str | None] = mapped_column(Text)  # 清洗后的纯文本
    source_url: Mapped[str | None] = mapped_column(String(500), unique=True)
    source_id: Mapped[int | None] = mapped_column(ForeignKey("trusted_sources.id"))
    credibility_score: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), default=Decimal("0.00"), index=True
    )
    publish_time: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    source: Mapped[TrustedSource | None] = relationship("TrustedSource")
    categories: Mapped[list[Category]] = relationship(
        "Category", secondary=info_category_relation
    )
