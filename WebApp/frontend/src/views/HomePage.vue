<template>
  <div class="home-page">
    <AppHeader />
    <main class="page-main feed-area">
      <FeedList />
    </main>
    <BottomNav />
    <CategoryDrawer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import AppHeader from "@/components/common/AppHeader.vue";
import BottomNav from "@/components/common/BottomNav.vue";
import CategoryDrawer from "@/components/category/CategoryDrawer.vue";
import FeedList from "@/components/feed/FeedList.vue";
import { useCategoryStore } from "@/stores/category";
import { useFeedStore } from "@/stores/feed";

const categoryStore = useCategoryStore();
const feedStore = useFeedStore();

onMounted(async () => {
  await categoryStore.loadTree();
  await feedStore.refresh(categoryStore.activeId);
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.feed-area {
  padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 16px);
}
</style>
