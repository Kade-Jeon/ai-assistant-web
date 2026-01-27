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
  const { fetchChatThreads, fetchConversation, sendChatMessage, deleteConversation, patchConversationSubject } = useApi()

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
      const firstThread = chatThreads[0]
      if (firstThread?.conversationId) {
        await selectThread(firstThread.conversationId)
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

    // 기존 대화방이면 conversationId 포함, 새 대화면 없음
    const activeThread = threads.value.find((thread) => thread.active)
    const conversationId = activeThread?.conversationId

    // 기존 대화방에서 채팅 보냈을 때: 해당 방을 최근 대화 맨 위로 올림
    if (conversationId) {
      const current = threads.value.find((t) => t.conversationId === conversationId)
      if (current) {
        const rest = threads.value.filter((t) => t.conversationId !== conversationId)
        threads.value = [{ ...current, active: true }, ...rest.map((t) => ({ ...t, active: false }))]
      }
    }

    const request: AssistantRequest = {
      promptType: PromptType.CONVERSATION,
      question: messageContent,
      ...(conversationId && { conversationId }),
    }

    console.log("[채팅 메시지 전송]", {
      request,
      messageContent,
      conversationId: conversationId ?? "(새 대화)",
    })

    try {
      // 첨부 파일이 있으면 첫 번째 파일만 전송 (백엔드가 단일 파일만 지원)
      const fileToSend = attachments && attachments.length > 0 ? attachments[0] : undefined

      // SSE 스트리밍 시작
      await sendChatMessage(
        request,
        // onMessage: 스트림에서 데이터를 받을 때마다 호출
        (data: string) => {
          // 메시지 배열에서 해당 assistant 메시지를 찾아 내용 업데이트
          const messageIndex = messages.value.findIndex(msg => msg.id === assistantMessageId)
          if (messageIndex !== -1) {
            const currentMessage = messages.value[messageIndex]
            if (currentMessage) {
              // 기존 내용에 새 데이터 추가 (스트리밍)
              messages.value[messageIndex] = {
                ...currentMessage,
                content: (currentMessage.content || "") + data,
              }
            }
          }
        },
        // onError: 에러 발생 시 — AI 응답 버블 제거, 사용자 메시지를 전송 실패로 표시
        (err: Error) => {
          messages.value = messages.value
            .filter((m) => m.id !== assistantMessageId)
            .map((m) => (m.id === userMessage.id ? { ...m, status: "failed" as const } : m))
          error.value = err.message
          isWaitingForResponse.value = false
          console.error("채팅 메시지 전송 실패:", err)
        },
        // onComplete: 스트림 완료 시
        () => {
          isWaitingForResponse.value = false
        },
        // onConversationCreated: 서버가 conversation_created SSE로 대화방(제목) 보내면 최근 대화 맨 위에 추가
        (item) => {
          const newThread: ChatThread = {
            id: item.conversationId,
            title: item.subject,
            active: true,
            conversationId: item.conversationId,
          }
          const others = threads.value
            .map((t) => ({ ...t, active: false }))
            .filter((t) => t.conversationId !== item.conversationId)
          threads.value = [newThread, ...others]
        },
        // file: 첨부 파일 전달
        fileToSend
      )
    } catch (err) {
      messages.value = messages.value
        .filter((m) => m.id !== assistantMessageId)
        .map((m) => (m.id === userMessage.id ? { ...m, status: "failed" as const } : m))
      error.value = err instanceof Error ? err.message : "채팅 메시지 전송에 실패했습니다."
      isWaitingForResponse.value = false
      console.error("채팅 메시지 전송 오류:", err)
    }
  }

  /** 전송 실패한 사용자 메시지 다시 보내기 */
  const retryMessage = (msg: ChatMessage) => {
    if (msg.role !== "user" || msg.status !== "failed") return
    messages.value = messages.value.filter((m) => m.id !== msg.id)
    sendMessage(msg.content, msg.attachments ?? [])
  }

  const startNewChat = () => {
    // 새 대화 시작: 모든 스레드 비활성화, 메시지·입력 초기화 (첫 메시지 전송 시 서버가 conversation_created로 목록에 추가)
    threads.value = threads.value.map((t) => ({ ...t, active: false }))
    messages.value = []
    messageInput.value = ""
    isWaitingForResponse.value = false
  }

  const deleteThread = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      const wasActive = threads.value.some((t) => t.conversationId === conversationId && t.active)
      threads.value = threads.value.filter((t) => t.conversationId !== conversationId)
      if (wasActive) {
        messages.value = []
        const first = threads.value[0]
        if (first) await selectThread(first.conversationId)
        else startNewChat()
      }
    } catch {
      // 토스트는 deleteConversation 내부에서 이미 표시함, 로컬 상태는 변경하지 않음
    }
  }

  const renameThread = async (conversationId: string, newTitle: string) => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    await patchConversationSubject(conversationId, trimmed)
    threads.value = threads.value.map((t) =>
      t.conversationId === conversationId ? { ...t, title: trimmed } : t,
    )
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
    sendMessage: sendMessage as (content?: string, attachments?: File[]) => void,
    retryMessage,
    startNewChat,
    selectThread,
    deleteThread,
    renameThread,
  }
}
