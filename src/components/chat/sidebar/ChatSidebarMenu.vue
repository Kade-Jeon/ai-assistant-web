<script setup lang="ts">
import { FolderPlus, LayoutDashboard } from "lucide-vue-next";

defineProps<{
  currentView: "chat" | "dashboard" | "project" | "pricing";
}>();

defineEmits<{
  (e: "dashboard"): void;
  (e: "new-project"): void;
}>();
</script>

<template>
  <!-- 메뉴: 대시보드, 새 프로젝트 추가 -->
  <div class="px-4 py-1 border-b">
    <h3
      class="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide mb-2"
    >
      메뉴
    </h3>
    <button
      class="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-sidebar-foreground transition-colors"
      :class="
        currentView === 'dashboard'
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : ''
      "
      @click="$emit('dashboard')"
    >
      <LayoutDashboard class="h-4 w-4" />
      <span>대시보드</span>
    </button>
    <button
      class="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-sidebar-foreground transition-colors"
      @click="$emit('new-project')"
    >
      <FolderPlus class="h-4 w-4" />
      <span>새 프로젝트 추가</span>
    </button>
  </div>
</template>
