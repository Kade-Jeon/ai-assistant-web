<script setup lang="ts">
import { MessageSquare } from "lucide-vue-next"
import type { ChatThread } from "@/types/chat"

defineProps<{
  threads: ChatThread[]
}>()

defineEmits<{
  (e: "select-thread"): [conversationId: string]
}>()
</script>

<template>
  <!-- 최근 대화 목록 -->
  <div class="flex-1 overflow-y-auto p-4">
    <div class="space-y-2">
      <h3 class="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide">최근 대화</h3>
      <div class="space-y-1">
        <button
          v-for="thread in threads"
          :key="thread.id"
          class="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-sidebar-accent text-left"
          :class="thread.active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground'"
          @click="$emit('select-thread', thread.conversationId)"
        >
          <MessageSquare class="h-4 w-4" />
          <span class="truncate">{{ thread.title }}</span>
        </button>
      </div>
    </div>
  </div>
</template>