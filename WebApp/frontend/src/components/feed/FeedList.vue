<template>
  <div class="feed-list">
    <FeedCard v-for="item in feedStore.items" :key="item.id" :item="item" />
    <div ref="sentinel" class="feed-sentinel">
      <template v-if="feedStore.loading">
        <Loader2 :size="18" :stroke-width="1.8" class="spinner" />
        <span>加载中…</span>
      </template>
      <span v-else-if="feedStore.offline" class="sentinel-offline">离线演示数据 · 后端未连接</span>
      <span v-else-if="feedStore.error" class="sentinel-error">网络异常，请稍后重试</span>
      <template v-else-if="feedStore.finished">
        <span v-if="feedStore.items.length" class="sentinel-end">— 没有更多了 —</span>
      </template>
    </div>
    <div v-if="!feedStore.loading && !feedStore.items.length" class="feed-empty">暂无内容</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Loader2 } from "lucide-vue-next";
import FeedCard from "./FeedCard.vue";
import { useFeedStore } from "@/stores/feed";

const feedStore = useFeedStore();
const sentinel = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && !feedStore.loading && !feedStore.finished) {
        feedStore.loadMore();
      }
    },
    { rootMargin: "300px 0px" }
  );
  if (sentinel.value) observer.observe(sentinel.value);
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<style scoped>
.feed-list {
  width: 100%;
  padding-top: 12px;
}

.feed-sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
  font-size: 13px;
  color: var(--text-muted);
}

.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.feed-empty {
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
}
</style>
