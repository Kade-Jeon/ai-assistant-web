import { computed, onMounted, ref } from "vue"
import type { ChatMessage, ChatThread } from "@/types/chat"
import { useApi } from "@/composables/useApi"

const createTimeLabel = () =>
  new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })

const createId = () => crypto.randomUUID()

export const useChatState = () => {
  const { fetchChatThreads, fetchConversation } = useApi()

  // 상태 관리
  const threads = ref<ChatThread[]>([])
  const messages = ref<ChatMessage[]>([])
  const messageInput = ref("")
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isWaitingForResponse = ref(false)

  const canSend = computed(() =>
    messageInput.value.trim().length > 0 && !isWaitingForResponse.value && !isLoading.value
  )

  // 대화방 선택 메서드
  const selectThread = async (conversationId: string) => {
    try {
      isLoading.value = true
      error.value = null

      // 선택된 대화방 표시 업데이트
      threads.value = threads.value.map(thread => ({
        ...thread,
        active: thread.conversationId === conversationId
      }))

      // 해당 대화 내용 불러오기
      const conversationMessages = await fetchConversation(conversationId)
      messages.value = conversationMessages
      messageInput.value = ""
    } catch (err) {
      error.value = err instanceof Error ? err.message : '대화방 선택에 실패했습니다.'
      console.error('대화방 선택 실패:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 초기 데이터 로딩
  const loadInitialData = async () => {
    try {
      isLoading.value = true
      error.value = null

      // 채팅방 목록 불러오기
      const chatThreads = await fetchChatThreads()
      threads.value = chatThreads

      // 첫 번째 대화방 자동 선택 (최근 대화)
      if (chatThreads.length > 0) {
        await selectThread(chatThreads[0].conversationId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '초기 데이터 로딩에 실패했습니다.'
      console.error('초기 데이터 로딩 실패:', err)
    } finally {
      isLoading.value = false
    }
  }

  const sendMessage = (content?: string, attachments?: File[]) => {
    // 이미 AI 응답을 기다리고 있으면 전송하지 않음
    if (isWaitingForResponse.value || isLoading.value) {
      return
    }

    const messageContent = (content || messageInput.value).trim()
    if (!messageContent && (!attachments || attachments.length === 0)) {
      return
    }

    // 사용자 메시지 추가
    messages.value = [
      ...messages.value,
      {
        id: createId(),
        role: "user",
        content: messageContent,
        time: createTimeLabel(),
        attachments: attachments,
      },
    ]
    messageInput.value = ""

    // AI 응답 대기 상태 시작
    isWaitingForResponse.value = true

    // AI 응답 시뮬레이션 (테스트용)
    setTimeout(() => {
      messages.value = [
        ...messages.value,
        {
          id: createId(),
          role: "assistant",
          content: "안녕하세요. 저는 AI, Kade 입니다. 현재는 테스트 기능을 수행중이며 정해진 내용을 답변합니다.",
          time: createTimeLabel(),
        },
      ]

      // AI 응답 완료 후 대기 상태 해제
      isWaitingForResponse.value = false
    }, 1000) // 1초 후 응답
  }

  const startNewChat = () => {
    // 모든 대화방 비활성화하고 첫 번째 대화방 선택
    if (threads.value.length > 0) {
      selectThread(threads.value[0].conversationId)
    }
    messageInput.value = ""
    isWaitingForResponse.value = false // 대기 상태 초기화
  }

  // 초기 데이터 로딩
  onMounted(() => {
    loadInitialData()
  })

  return {
    canSend,
    messageInput,
    messages,
    threads,
    isLoading,
    error,
    isWaitingForResponse,
    sendMessage: sendMessage as (content?: string) => void,
    startNewChat,
    selectThread,
  }
}
