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
const { isSidebarOpen, isMobile } = useSidebarState()
const { canSend, messageInput, messages, threads, isLoading, sendMessage, startNewChat, selectThread } = useChatState()

// 현재 뷰 상태 ('chat' | 'dashboard')
const currentView = ref<'chat' | 'dashboard'>('chat')

// 공통 뷰 변경 핸들러
const handleViewChange = (view: 'chat' | 'dashboard', conversationId?: string) => {
  console.log(`뷰 변경: ${currentView.value} → ${view}`, conversationId ? `(대화: ${conversationId})` : '')

  // 대화 선택인 경우 selectThread 호출
  if (conversationId) {
    selectThread(conversationId)
  }

  // 새 채팅 시작인 경우 startNewChat 호출 (conversationId가 undefined일 때)
  if (view === 'chat' && !conversationId) {
    startNewChat()
  }

  currentView.value = view
  console.log('변경 후 view:', currentView.value)

  // 모바일에서는 사이드바 자동 닫힘
  if (isMobile.value) {
    nextTick(() => {
      isSidebarOpen.value = false
    })
  }

  // 대화 선택인 경우 추가 nextTick
  if (conversationId) {
    nextTick(() => {
      console.log('nextTick completed')
    })
  }
}

const handleDashboard = () => handleViewChange('dashboard')
const handleSelectThread = (conversationId: string) => handleViewChange('chat', conversationId)
const handleNewChat = () => handleViewChange('chat')
</script>

<template>
  <div class="flex h-screen">
    <ChatSidebar :threads="threads" :is-open="isSidebarOpen" :currentView="currentView" @new-chat="handleNewChat" @dashboard="handleDashboard" @select-thread="handleSelectThread" />
    <div class="flex-1 flex flex-col overflow-hidden">
      <ChatHeader :is-dark="isDark" :is-sidebar-open="isSidebarOpen" @toggle-theme="toggleTheme" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      <div class="flex-1 flex flex-col min-h-0">
        <!-- 채팅 뷰 -->
        <div v-show="currentView === 'chat'" class="flex-1 flex flex-col min-h-0">
          <ChatMessageList :messages="messages" :is-sidebar-open="isSidebarOpen" :is-loading="isLoading" />
          <ChatInput v-model="messageInput" :can-send="canSend" @send="(value, attachments) => sendMessage(value, attachments)" />
        </div>

        <!-- 대시보드 뷰 -->
        <div v-show="currentView === 'dashboard'" class="flex-1 overflow-y-auto">
          <Dashboard :is-visible="currentView === 'dashboard'" @back-to-chat="currentView = 'chat'" />
        </div>
      </div>
    </div>

  </div>
</template>

