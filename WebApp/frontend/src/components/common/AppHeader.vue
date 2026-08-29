<template>
  <header class="app-header">
    <button class="header-btn pressable" aria-label="打开分类" @click="categoryStore.openDrawer()">
      <Menu :size="24" :stroke-width="1.8" />
    </button>
    <div class="search-box">
      <Search :size="16" :stroke-width="1.8" class="search-icon" />
      <input
        v-model="feedStore.keyword"
        class="search-input"
        type="search"
        placeholder="搜索信息"
        enterkeyhint="search"
        @keyup.enter="onEnter"
        @search="onSearch"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu, Search } from "lucide-vue-next";
import { useCategoryStore } from "@/stores/category";
import { useFeedStore } from "@/stores/feed";

const categoryStore = useCategoryStore();
const feedStore = useFeedStore();

let searchTimer: number | undefined;

/** 防抖 50ms 后刷新（输入过程中不反复请求） */
function onSearch() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    feedStore.refresh(categoryStore.activeId, feedStore.keyword);
  }, 50);
}

/** 回车触发搜索：IME 组合中跳过，避免中文输入法选词时误触发 */
function onEnter(e: KeyboardEvent) {
  if ((e as KeyboardEvent & { isComposing?: boolean }).isComposing || e.keyCode === 229) return;
  onSearch();
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  color: var(--text-primary);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  background: var(--bg-elevated);
}

.search-icon {
  flex-shrink: 0;
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}
</style>
