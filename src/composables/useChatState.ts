import { computed, onMounted, ref } from "vue"
import type { AssistantRequest, ChatMessage, ChatThread } from "@/types/chat"
import { PromptType } from "@/types/chat"
import { useApi } from "@/composables/useApi"

const createTimeLabel = () => {
  const now = new Date()

  // 날짜 부분 (2025.01.23)
  const dateStr = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).replace(/\./g, '').replace(/ /g, '.')

  // 시간 부분 (오전 11:14)
  const timeStr = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${dateStr} ${timeStr}`
}

const createId = () => crypto.randomUUID()

export const useChatState = () => {
  const { fetchChatThreads, fetchConversation, sendChatMessage } = useApi()

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

  const sendMessage = async (content?: string, attachments?: File[]) => {
    // 이미 AI 응답을 기다리고 있으면 전송하지 않음
    if (isWaitingForResponse.value || isLoading.value) {
      return
    }

    const messageContent = (content || messageInput.value).trim()
    if (!messageContent && (!attachments || attachments.length === 0)) {
      return
    }

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: messageContent,
      time: createTimeLabel(),
      attachments: attachments,
    }
    messages.value = [...messages.value, userMessage]
    messageInput.value = ""

    // AI 응답 대기 상태 시작
    isWaitingForResponse.value = true
    error.value = null

    // Assistant 응답 메시지 생성 (스트리밍으로 내용이 추가됨)
    const assistantMessageId = createId()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      time: createTimeLabel(),
    }
    messages.value = [...messages.value, assistantMessage]

    // 현재 활성화된 대화방의 sessionId 가져오기 (있을 경우)
    const activeThread = threads.value.find(thread => thread.active)
    const sessionId = activeThread?.conversationId

    // AssistantRequest 생성
    const request: AssistantRequest = {
      promptType: PromptType.CONVERSATION,
      question: messageContent,
      sessionId: sessionId,
      // 필요시 추가 필드 설정
      // language: "ko",
      // targetType: "...",
      // toneType: "...",
      // userId: "...",
      // tenant: "...",
    }

    console.log("[채팅 메시지 전송]", {
      request,
      messageContent,
      sessionId,
    })

    try {
      // SSE 스트리밍 시작
      await sendChatMessage(
        request,
        // onMessage: 스트림에서 데이터를 받을 때마다 호출
        (data: string) => {
          // 메시지 배열에서 해당 assistant 메시지를 찾아 내용 업데이트
          const messageIndex = messages.value.findIndex(msg => msg.id === assistantMessageId)
          if (messageIndex !== -1) {
            // 기존 내용에 새 데이터 추가 (스트리밍)
            messages.value[messageIndex] = {
              ...messages.value[messageIndex],
              content: messages.value[messageIndex].content + data,
            }
          }
        },
        // onError: 에러 발생 시
        (err: Error) => {
          error.value = err.message
          isWaitingForResponse.value = false
          console.error("채팅 메시지 전송 실패:", err)
        },
        // onComplete: 스트림 완료 시
        () => {
          isWaitingForResponse.value = false
        }
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : "채팅 메시지 전송에 실패했습니다."
      isWaitingForResponse.value = false
      console.error("채팅 메시지 전송 오류:", err)
    }
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
