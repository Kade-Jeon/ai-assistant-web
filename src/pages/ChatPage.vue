<script setup lang="ts">
import ChatHeader from "@/components/chat/ChatHeader.vue"
import ChatInput from "@/components/chat/ChatInput.vue"
import ChatMessageList from "@/components/chat/ChatMessageList.vue"
import ChatSidebar from "@/components/chat/ChatSidebar.vue"
import Dashboard from "@/components/Dashboard.vue"
import { useChatState } from "@/composables/useChatState"
import { useSidebarState } from "@/composables/useSidebarState"
import { useTheme } from "@/composables/useTheme"
import { nextTick, ref } from "vue"

const { isDark, toggleTheme } = useTheme()
const { isSidebarOpen } = useSidebarState()
const { canSend, messageInput, messages, threads, isLoading, sendMessage, startNewChat, selectThread } = useChatState()

// 현재 뷰 상태 ('chat' | 'dashboard')
const currentView = ref<'chat' | 'dashboard'>('chat')

const handleDashboard = () => {
  console.log('대시보드 클릭됨, 현재 view:', currentView.value)
  currentView.value = 'dashboard'
  console.log('변경 후 view:', currentView.value)
}

const handleSelectThread = async (conversationId: string) => {
  console.log('handleSelectThread called with:', conversationId)
  await selectThread(conversationId)
  currentView.value = 'chat'
  console.log('currentView set to chat')
  await nextTick()
  console.log('nextTick completed')
}

const handleNewChat = () => {
  startNewChat()
  currentView.value = 'chat'
}
</script>

<template>
  <div class="flex h-screen">
    <ChatSidebar :threads="threads" :is-open="isSidebarOpen" @new-chat="handleNewChat" @dashboard="handleDashboard" @select-thread="handleSelectThread" />
    <div class="flex-1 flex flex-col overflow-hidden">
      <ChatHeader :is-dark="isDark" :is-sidebar-open="isSidebarOpen" @toggle-theme="toggleTheme" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      <div class="flex-1 flex flex-col min-h-0">
        <!-- 채팅 뷰 -->
        <div v-show="currentView === 'chat'" class="flex-1 flex flex-col min-h-0">
          <ChatMessageList :messages="messages" :is-sidebar-open="isSidebarOpen" :is-loading="isLoading" />
          <ChatInput v-model="messageInput" :can-send="canSend" @send="(value) => sendMessage(value)" />
        </div>

        <!-- 대시보드 뷰 -->
        <div v-show="currentView === 'dashboard'" class="flex-1 overflow-y-auto">
          <Dashboard :is-visible="currentView === 'dashboard'" @back-to-chat="currentView = 'chat'" />
        </div>
      </div>
    </div>

  </div>
</template>

