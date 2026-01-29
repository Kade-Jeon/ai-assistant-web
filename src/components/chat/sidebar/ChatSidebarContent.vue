<script setup lang="ts">
import ChatSidebarSearch from "./ChatSidebarSearch.vue";
import ChatSidebarMenu from "./ChatSidebarMenu.vue";
import ChatSidebarHistory from "./ChatSidebarHistory.vue";
import type { ChatThread } from "@/types/chat";

defineProps<{
  threads: ChatThread[];
  currentView: "chat" | "dashboard" | "pricing";
}>();

defineEmits<{
  (e: "dashboard"): void;
  (e: "select-thread", conversationId: string): void;
  (e: "rename", conversationId: string): void;
  (e: "delete", conversationId: string): void;
}>();
</script>

<template>
  <ChatSidebarSearch />
  <ChatSidebarMenu :currentView="currentView" @dashboard="$emit('dashboard')" />
  <ChatSidebarHistory
    :threads="threads"
    @select-thread="$emit('select-thread', $event)"
    @rename="$emit('rename', $event)"
    @delete="$emit('delete', $event)"
  />
</template>
