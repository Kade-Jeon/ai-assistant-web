<script setup lang="ts">
import ChatHeader from "@/components/chat/ChatHeader.vue"
import ChatInput from "@/components/chat/ChatInput.vue"
import ChatMessageList from "@/components/chat/ChatMessageList.vue"
import ChatSidebar from "@/components/chat/ChatSidebar.vue"
import Dashboard from "@/components/Dashboard.vue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChatState } from "@/composables/useChatState"
import { useSidebarState } from "@/composables/useSidebarState"
import { useTheme } from "@/composables/useTheme"
import { nextTick, ref } from "vue"

const { isDark, toggleTheme } = useTheme()
const { isSidebarOpen, isMobile } = useSidebarState()
const { canSend, messageInput, messages, threads, isLoading, sendMessage, retryMessage, startNewChat, selectThread, deleteThread, renameThread } = useChatState()

// 현재 뷰 상태 ('chat' | 'dashboard')
const currentView = ref<'chat' | 'dashboard'>('chat')

// 제목 변경 플로팅 폼
const renamingConversationId = ref<string | null>(null)
const editingTitle = ref("")

const openRenameForm = (conversationId: string) => {
  const thread = threads.value.find((t) => t.conversationId === conversationId)
  renamingConversationId.value = conversationId
  editingTitle.value = thread?.title ?? ""
}

const closeRenameForm = () => {
  renamingConversationId.value = null
  editingTitle.value = ""
}

const handleRenameConfirm = async () => {
  const id = renamingConversationId.value
  const title = editingTitle.value.trim()
  if (!id || !title) return
  try {
    await renameThread(id, title)
    closeRenameForm()
  } catch {
    // 실패 시 토스트는 API 내부에서 표시됨, 폼은 열린 채로 두어 재시도 가능
  }
}

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
    <ChatSidebar
      :threads="threads"
      :is-open="isSidebarOpen"
      :currentView="currentView"
      @new-chat="handleNewChat"
      @dashboard="handleDashboard"
      @select-thread="handleSelectThread"
      @rename="openRenameForm"
      @delete="deleteThread"
    />
    <div class="flex-1 flex flex-col overflow-hidden">
      <ChatHeader :is-dark="isDark" :is-sidebar-open="isSidebarOpen" @toggle-theme="toggleTheme" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      <div class="flex-1 flex flex-col min-h-0">
        <!-- 채팅 뷰: 버블 영역 기준 토스트용 컨테이너 -->
        <div v-show="currentView === 'chat'" class="flex-1 flex flex-col min-h-0">
          <div class="flex-1 min-h-0 relative flex flex-col">
            <ChatMessageList :messages="messages" :is-sidebar-open="isSidebarOpen" :is-loading="isLoading" @retry="retryMessage" />
            <div id="chat-toast-container" class="absolute inset-0 pointer-events-none flex items-start justify-center pt-20 z-[100]" aria-hidden="true" />
          </div>
          <ChatInput v-model="messageInput" :can-send="canSend" @send="(value, attachments) => sendMessage(value, attachments)" />
        </div>

        <!-- 대시보드 뷰 -->
        <div v-show="currentView === 'dashboard'" class="flex-1 overflow-y-auto">
          <Dashboard :is-visible="currentView === 'dashboard'" @back-to-chat="currentView = 'chat'" />
        </div>
      </div>
    </div>

    <!-- 제목 변경 플로팅 폼 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        leave-active-class="transition duration-150 ease-in"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="renamingConversationId"
          class="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-title"
          @click.self="closeRenameForm"
        >
          <div
            class="w-full max-w-sm rounded-lg border bg-card p-4 shadow-lg"
            @click.stop
          >
            <h3 id="rename-title" class="mb-3 text-sm font-medium text-foreground">
              제목 변경
            </h3>
            <Input
              v-model="editingTitle"
              class="mb-1"
              placeholder="대화 제목"
              maxlength="36"
              autofocus
              @keydown.enter="handleRenameConfirm"
              @keydown.escape="closeRenameForm"
            />
            <p class="mb-4 text-right text-xs text-muted-foreground">
              {{ editingTitle.length }}/36자
            </p>
            <div class="flex justify-end gap-2">
              <Button variant="outline" size="sm" @click="closeRenameForm">
                취소
              </Button>
              <Button size="sm" :disabled="!editingTitle.trim()" @click="handleRenameConfirm">
                확인
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

