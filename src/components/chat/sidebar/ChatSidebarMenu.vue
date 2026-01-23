<script setup lang="ts">
import { LayoutDashboard } from "lucide-vue-next"

defineProps<{
  currentView: 'chat' | 'dashboard'
}>()

defineEmits<{
  (e: "dashboard"): void
}>()
</script>

<template>
  <!-- 메뉴 -->
  <div class="px-4 py-1 border-b">
    <h3 class="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide mb-2">메뉴</h3>
    <button
      class="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
      :class="currentView === 'dashboard' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
      @click="$emit('dashboard')"
    >
      <LayoutDashboard class="h-4 w-4" />
      <span>대시보드</span>
    </button>
  </div>
</template>