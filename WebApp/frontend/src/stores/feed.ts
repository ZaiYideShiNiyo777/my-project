import { defineStore } from "pinia";
import { ref } from "vue";
import { getFeed } from "@/api";
import { categoryTree, fallbackItems } from "@/mock/fallback";
import type { FeedItem } from "@/types";

const PAGE_SIZE = 20;

// 二级分类 -> 一级分类 映射（离线过滤时子分类命中父分类）
const parentMap: Record<number, number> = {};
for (const node of categoryTree) {
  for (const child of node.children ?? []) parentMap[child.id] = node.id;
}

/** 条目是否属于该分类（含父分类命中子分类的语义） */
function matchesCategory(item: FeedItem, categoryId: number): boolean {
  if (!categoryId) return true;
  const ids = item.category_ids?.length ? item.category_ids : item.category_id ? [item.category_id] : [];
  return ids.includes(categoryId) || ids.some((id) => parentMap[id] === categoryId);
}

/** 离线兜底过滤：分类 + 关键词（title/summary 大小写不敏感） */
function filterFallback(categoryId: number, keyword: string): FeedItem[] {
  const kw = keyword.trim().toLowerCase();
  return fallbackItems.filter((item) =>
    matchesCategory(item, categoryId)
      ? kw
        ? item.title.toLowerCase().includes(kw) || (item.summary ?? "").toLowerCase().includes(kw)
        : true
      : false
  );
}

export const useFeedStore = defineStore("feed", () => {
  const items = ref<FeedItem[]>([]);
  const total = ref(0);
  const page = ref(0);
  const pageSize = ref(PAGE_SIZE);
  const loading = ref(false);
  const finished = ref(false);
  const error = ref(false);
  const offline = ref(false);
  const categoryId = ref(0);
  const keyword = ref("");

  // 请求竞态防护：旧请求返回时丢弃，防止覆盖新分类/关键词的结果
  let requestSeq = 0;

  /** 刷新信息流（换分类/搜索时调用） */
  async function refresh(cid: number = categoryId.value, kw: string = keyword.value) {
    requestSeq++;
    categoryId.value = cid;
    keyword.value = kw;
    items.value = [];
    page.value = 0;
    total.value = 0;
    error.value = false;
    offline.value = false;
    finished.value = false;
    loading.value = false;
    await loadMore();
  }

  /** 加载下一页（触底 sentinel 调用） */
  async function loadMore() {
    if (loading.value || finished.value) return;
    const seq = requestSeq;
    loading.value = true;
    const nextPage = page.value + 1;
    try {
      const res = await getFeed({
        category_id: categoryId.value,
        page: nextPage,
        page_size: pageSize.value,
        keyword: keyword.value || undefined,
      });
      if (seq !== requestSeq) return;
      items.value.push(...res.items);
      total.value = res.total;
      page.value = res.page;
      finished.value = items.value.length >= res.total;
      error.value = false;
    } catch {
      if (seq !== requestSeq) return;
      if (items.value.length === 0) {
        // 首屏失败 -> 离线降级（后端未连接时用兜底数据）
        const fallback = filterFallback(categoryId.value, keyword.value);
        if (fallback.length) {
          items.value = fallback;
          total.value = fallback.length;
          finished.value = true;
          offline.value = true;
        } else {
          error.value = true;
        }
      } else {
        // 翻页失败 -> 视为已到底
        finished.value = true;
      }
    } finally {
      if (seq === requestSeq) loading.value = false;
    }
  }

  return {
    items,
    total,
    page,
    pageSize,
    loading,
    finished,
    error,
    offline,
    categoryId,
    keyword,
    refresh,
    loadMore,
  };
});
