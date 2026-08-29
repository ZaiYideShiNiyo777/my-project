<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="categoryStore.drawerVisible" class="drawer-root">
        <div class="drawer-mask" @click="categoryStore.closeDrawer()" />
        <aside class="drawer-panel safe-bottom">
          <div class="drawer-header">
            <span class="drawer-title">全部分类</span>
            <button class="drawer-close pressable" aria-label="关闭分类" @click="categoryStore.closeDrawer()">
              <X :size="22" :stroke-width="1.8" />
            </button>
          </div>
          <ul class="drawer-list">
            <li>
              <button
                :class="['drawer-item pressable', { active: categoryStore.activeId === 0 }]"
                data-cat-id="0"
                @click="select(0)"
              >
                <span class="item-label">全部推荐</span>
              </button>
            </li>
            <li v-if="categoryStore.loading && !categoryStore.flatList.length" class="drawer-loading">
              分类加载中…
            </li>
            <li v-for="cat in categoryStore.flatList" :key="cat.id">
              <button
                :class="['drawer-item pressable', { active: cat.id === categoryStore.activeId }]"
                :data-cat-id="cat.id"
                :style="{ paddingLeft: `${16 + cat.depth * 20}px` }"
                @click="select(cat.id)"
              >
                <component :is="getCategoryIcon(cat.icon_name)" :size="18" :stroke-width="1.8" class="item-icon" />
                <span class="item-label">{{ cat.name }}</span>
              </button>
            </li>
          </ul>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, watch } from "vue";
import { X } from "lucide-vue-next";
import { useCategoryStore } from "@/stores/category";
import { useFeedStore } from "@/stores/feed";
import { getCategoryIcon } from "@/utils/iconMap";

const categoryStore = useCategoryStore();
const feedStore = useFeedStore();

/** 滚动列表让当前选中分类居中（打开时与列表就绪后各定位一次） */
function scrollToActive() {
  const list = document.querySelector(".drawer-list");
  if (!list) return;
  const el = list.querySelector(`[data-cat-id="${categoryStore.activeId}"]`);
  if (el) {
    list.scrollTop = (el as HTMLElement).offsetTop - list.clientHeight / 2 + (el as HTMLElement).clientHeight / 2;
  }
}

watch(
  () => categoryStore.drawerVisible,
  async (visible) => {
    document.body.style.overflow = visible ? "hidden" : "";
    if (visible) {
      await nextTick();
      requestAnimationFrame(scrollToActive);
    }
  }
);

watch(
  () => categoryStore.flatList.length,
  () => {
    if (categoryStore.drawerVisible) requestAnimationFrame(scrollToActive);
  }
);

function select(id: number) {
  if (id === categoryStore.activeId) {
    categoryStore.closeDrawer();
    return;
  }
  categoryStore.selectCategory(id);
  feedStore.refresh(id);
  window.scrollTo({ top: 0, behavior: "auto" });
}
</script>

<style scoped>
.drawer-root {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.drawer-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.drawer-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: 16px 16px 0 0;
  border-top: 1px solid var(--border-subtle);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 4px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--text-secondary);
}

.drawer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 16px;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 44px;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: left;
}

.drawer-item.active {
  color: var(--accent);
  background: var(--accent-dim);
}

.item-icon {
  flex-shrink: 0;
}

.item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drawer-loading {
  padding: 16px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateY(100%);
}
</style>
