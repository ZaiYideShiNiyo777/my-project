<template>
  <nav class="bottom-nav safe-bottom">
    <button
      :class="['nav-item pressable', { active: categoryStore.activeId === 0 }]"
      aria-label="返回主页"
      @click="goHome"
    >
      <House :size="24" :stroke-width="1.8" />
    </button>
    <button
      v-for="cat in mainCats"
      :key="cat.id"
      :class="['nav-item pressable', { active: cat.id === categoryStore.activeId }]"
      :aria-label="cat.name"
      @click="goCat(cat.id)"
    >
      <component :is="cat.icon" :size="24" :stroke-width="1.8" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Cpu,
  Factory,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  type LucideIcon,
} from "lucide-vue-next";
import { useCategoryStore } from "@/stores/category";
import { useFeedStore } from "@/stores/feed";

const MAIN_NAMES = ["科技", "财经", "医疗", "教育", "制造"];
const MAIN_ICONS: Record<string, LucideIcon> = {
  科技: Cpu,
  财经: Landmark,
  医疗: HeartPulse,
  教育: GraduationCap,
  制造: Factory,
};

const categoryStore = useCategoryStore();
const feedStore = useFeedStore();

/** 底部 5 个主分类（从分类树按名称解析 id，分类树未加载时为空） */
const mainCats = computed(() =>
  MAIN_NAMES.map((name) => {
    const node = categoryStore.tree.find((n) => n.name === name && !n.parent_id);
    return { id: node?.id ?? 0, name, icon: MAIN_ICONS[name] };
  }).filter((c) => c.id > 0)
);

function goCat(id: number) {
  if (id === categoryStore.activeId) return;
  categoryStore.selectCategory(id);
  feedStore.refresh(id);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function goHome() {
  if (categoryStore.activeId === 0) return;
  categoryStore.selectCategory(0);
  feedStore.refresh(0);
  window.scrollTo({ top: 0, behavior: "auto" });
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: var(--nav-height);
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-subtle);
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--text-muted);
}

.nav-item.active {
  color: var(--accent);
}
</style>
