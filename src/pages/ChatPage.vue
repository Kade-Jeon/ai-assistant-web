<script setup lang="ts">
import ChatHeader from "@/components/chat/ChatHeader.vue"
import ChatInput from "@/components/chat/ChatInput.vue"
import ChatMessageList from "@/components/chat/ChatMessageList.vue"
import ChatSidebar from "@/components/chat/ChatSidebar.vue"
import { useChatState } from "@/composables/useChatState"
import { useSidebarState } from "@/composables/useSidebarState"
import { useTheme } from "@/composables/useTheme"

const { isDark, toggleTheme } = useTheme()
const { isSidebarOpen } = useSidebarState()
const { canSend, messageInput, messages, threads, sendMessage, startNewChat } = useChatState()

const handleDashboard = () => {
  // TODO: 대시보드 페이지로 이동 또는 모달 열기
  console.log('대시보드 메뉴 클릭됨')
}
</script>

<template>
  <div class="flex h-screen">
    <ChatSidebar :threads="threads" :is-open="isSidebarOpen" @new-chat="startNewChat" @dashboard="handleDashboard" />
    <div class="flex-1 flex flex-col overflow-hidden">
      <ChatHeader :is-dark="isDark" :is-sidebar-open="isSidebarOpen" @toggle-theme="toggleTheme" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      <div class="flex-1 flex flex-col min-h-0">
        <ChatMessageList :messages="messages" :is-sidebar-open="isSidebarOpen" />
        <ChatInput v-model="messageInput" :can-send="canSend" @send="(value) => sendMessage(value)" />
      </div>
    </div>
  </div>
</template>
