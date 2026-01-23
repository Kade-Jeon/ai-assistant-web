<script setup lang="ts">
import ChatSidebarSearch from "./ChatSidebarSearch.vue"
import ChatSidebarMenu from "./ChatSidebarMenu.vue"
import ChatSidebarHistory from "./ChatSidebarHistory.vue"
import type { ChatThread } from "@/types/chat"

defineProps<{
  threads: ChatThread[]
}>()

defineEmits<{
  (e: "dashboard"): void
}>()
</script>

<template>
  <ChatSidebarSearch />
  <ChatSidebarMenu @dashboard="$emit('dashboard')" />
  <ChatSidebarHistory :threads="threads" />
</template>