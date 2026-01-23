<script setup lang="ts">
import ChatSidebarSearch from "./ChatSidebarSearch.vue"
import ChatSidebarMenu from "./ChatSidebarMenu.vue"
import ChatSidebarHistory from "./ChatSidebarHistory.vue"
import type { ChatThread } from "@/types/chat"

defineProps<{
  threads: ChatThread[]
  currentView: 'chat' | 'dashboard'
}>()

defineEmits<{
  (e: "dashboard"): void
  (e: "select-thread"): [conversationId: string]
}>()
</script>

<template>
  <ChatSidebarSearch />
  <ChatSidebarMenu :currentView="currentView" @dashboard="$emit('dashboard')" />
  <ChatSidebarHistory :threads="threads" @select-thread="$emit('select-thread', $event)" />
</template>