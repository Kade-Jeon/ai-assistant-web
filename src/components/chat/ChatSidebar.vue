<script setup lang="ts">
import ChatSidebarHeader from "./sidebar/ChatSidebarHeader.vue"
import ChatSidebarContent from "./sidebar/ChatSidebarContent.vue"
import ChatSidebarFooter from "./sidebar/ChatSidebarFooter.vue"
import type { ChatThread } from "@/types/chat"

defineProps<{
  threads: ChatThread[]
  isOpen: boolean
}>()

defineEmits<{
  (e: "new-chat"): void
  (e: "dashboard"): void
}>()
</script>

<template>
  <transition
    enter-active-class="transition-transform duration-300 ease-out"
    leave-active-class="transition-transform duration-300 ease-in"
    enter-from-class="transform -translate-x-full"
    enter-to-class="transform translate-x-0"
    leave-from-class="transform translate-x-0"
    leave-to-class="transform -translate-x-full"
  >
    <div v-if="isOpen" class="w-64 bg-sidebar border-r flex flex-col h-full">
      <ChatSidebarHeader @new-chat="$emit('new-chat')" />
      <ChatSidebarContent :threads="threads" @dashboard="$emit('dashboard')" />
      <ChatSidebarFooter />
    </div>
  </transition>
</template>
