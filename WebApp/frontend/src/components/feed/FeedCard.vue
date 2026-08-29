<template>
  <button class="feed-card pressable" @click="open">
    <h3 class="card-title clamp-2">{{ item.title }}</h3>
    <div class="card-meta">
      <span :class="['dot', dotClass]" aria-hidden="true" />
      <span class="meta-source">{{ item.source_name || "未知来源" }}</span>
      <span class="meta-time">{{ formatTime(item.publish_time) }}</span>
      <span class="meta-sep">·</span>
      <span v-if="item.category_name" class="meta-tag">{{ item.category_name }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";
import type { FeedItem } from "@/types";
import { formatTime } from "@/utils/format";

const props = defineProps({
  item: { type: Object as PropType<FeedItem>, required: true },
});

/** 可信度 >= 0.8 高亮绿点，否则灰点 */
const dotClass = computed(() => (props.item.credibility_score >= 0.8 ? "dot-high" : "dot-normal"));

function open() {
  if (props.item.source_url) {
    window.open(props.item.source_url, "_blank", "noopener");
  }
}
</script>

<style scoped>
.feed-card {
  display: block;
  width: 100%;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-card);
  text-align: left;
}

.card-title {
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text-primary);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-high {
  background: var(--dot-high);
}

.dot-normal {
  background: var(--dot-normal);
}

.meta-source {
  max-width: 40%;
  flex-shrink: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-time {
  flex-shrink: 0;
}

.meta-sep {
  flex-shrink: 0;
  color: var(--text-muted);
}

.meta-tag {
  flex-shrink: 0;
  padding: 1px 8px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  color: var(--accent);
  background: var(--accent-dim);
}
</style>
