import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { getCategoryTree } from "@/api";
import { categoryTree as fallbackTree } from "@/mock/fallback";
import type { CategoryNode, FlatCategory } from "@/types";

const STORAGE_KEY = "trust-aggregator:active-category";

/** 从 localStorage 读取上次选中的分类，非法值回退 0（全部推荐） */
function readStoredId(): number {
  const value = Number(localStorage.getItem(STORAGE_KEY) ?? "0");
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

/** 分类树拍平为带缩进深度的列表（抽屉渲染用） */
function flattenTree(nodes: CategoryNode[], depth = 0): FlatCategory[] {
  return nodes.flatMap((node) => [
    { ...node, children: undefined, depth },
    ...flattenTree(node.children ?? [], depth + 1),
  ]);
}

export const useCategoryStore = defineStore("category", () => {
  const tree = ref<CategoryNode[]>([]);
  const flatList = ref<FlatCategory[]>([]);
  const activeId = ref<number>(readStoredId());
  const drawerVisible = ref(false);
  const loaded = ref(false);
  const loading = ref(false);

  const activeCategory = computed(() => flatList.value.find((n) => n.id === activeId.value) ?? null);

  /** 加载分类树（成功用后端，失败用离线兜底，只加载一次） */
  async function loadTree() {
    if (loaded.value) return;
    loading.value = true;
    try {
      tree.value = await getCategoryTree();
    } catch {
      tree.value = fallbackTree;
    }
    flatList.value = flattenTree(tree.value);
    loaded.value = true;
    loading.value = false;
    validateActive();
  }

  /** 选中分类失效（如后端分类调整）时回退到全部推荐 */
  function validateActive() {
    if (activeId.value > 0 && !flatList.value.some((n) => n.id === activeId.value)) {
      activeId.value = 0;
      localStorage.setItem(STORAGE_KEY, "0");
    }
  }

  function selectCategory(id: number) {
    activeId.value = id;
    localStorage.setItem(STORAGE_KEY, String(id));
    drawerVisible.value = false;
  }

  function openDrawer() {
    drawerVisible.value = true;
    if (!loaded.value) loadTree();
  }

  function closeDrawer() {
    drawerVisible.value = false;
  }

  return {
    tree,
    flatList,
    activeId,
    activeCategory,
    drawerVisible,
    loaded,
    loading,
    loadTree,
    validateActive,
    selectCategory,
    openDrawer,
    closeDrawer,
  };
});
