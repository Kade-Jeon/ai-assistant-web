import { computed, nextTick, onMounted, ref } from "vue"
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
  
  // 페이지네이션 상태 관리
  const currentConversationId = ref<string | null>(null)
  const isLoadingMore = ref(false)
  const hasMoreMessages = ref(true)

  const canSend = computed(() =>
    messageInput.value.trim().length > 0 && !isWaitingForResponse.value && !isLoading.value
  )

  // 대화방 선택 메서드
  const selectThread = async (conversationId: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      // 대화방이 변경되면 페이지네이션 상태 초기화
      if (currentConversationId.value !== conversationId) {
        currentConversationId.value = conversationId
        hasMoreMessages.value = true
      }

      // 선택된 대화방 표시 업데이트
      threads.value = threads.value.map(thread => ({
        ...thread,
        active: thread.conversationId === conversationId
      }))

      // 해당 대화 내용 불러오기 (최근 20개만, beforeTimestamp 없이)
      const conversationMessages = await fetchConversation(conversationId)
      messages.value = conversationMessages
      
      // 서버에서 반환된 메시지가 20개 미만이면 더 이상 로드할 메시지가 없음
      hasMoreMessages.value = conversationMessages.length >= 20
      
      messageInput.value = ""
    } catch (err) {
      error.value = err instanceof Error ? err.message : '대화방 선택에 실패했습니다.'
      console.error('대화방 선택 실패:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 이전 메시지 더 불러오기 (무한 스크롤)
   * 스크롤을 위로 올렸을 때 호출됩니다.
   */
  const loadMoreMessages = async (): Promise<void> => {
    // 이미 로딩 중이거나 더 이상 메시지가 없거나 대화방이 선택되지 않았으면 리턴
    if (
      isLoadingMore.value ||
      !hasMoreMessages.value ||
      !currentConversationId.value ||
      messages.value.length === 0
    ) {
      return
    }

    try {
      isLoadingMore.value = true
      
      // 가장 오래된 메시지의 timestamp 찾기
      const oldestMessage = messages.value[0]
      if (!oldestMessage?.rawTimestamp) {
        hasMoreMessages.value = false
        return
      }

      // 이전 메시지 가져오기
      const olderMessages = await fetchConversation(
        currentConversationId.value,
        oldestMessage.rawTimestamp,
      )

      // 서버에서 반환된 메시지가 20개 미만이면 더 이상 로드할 메시지가 없음
      if (olderMessages.length < 20) {
        hasMoreMessages.value = false
      }

      // 메시지 배열 앞쪽에 추가 (unshift)
      if (olderMessages.length > 0) {
        messages.value = [...olderMessages, ...messages.value]
      }
    } catch (err) {
      console.error("이전 메시지 로드 실패:", err)
      // 에러 발생 시에도 사용자에게는 조용히 실패 처리 (토스트는 fetchConversation 내부에서 표시됨)
    } finally {
      isLoadingMore.value = false
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
      isStreaming: true,
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
      // 재시도 시 중복 저장 방지용 (한 번만 생성, 재시도 시 동일 키 사용)
      const idempotencyKey = crypto.randomUUID()

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
              // 배열을 새로 만들어서 반응성 보장
              const updatedMessages = [...messages.value]
              updatedMessages[messageIndex] = {
                ...currentMessage,
                content: (currentMessage.content || "") + data,
                isStreaming: true,
              }
              messages.value = updatedMessages
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
        async () => {
          console.log("[useChatState] onComplete 호출됨", { assistantMessageId })
          isWaitingForResponse.value = false
          // 스트리밍 완료 표시 - Vue 반응성 보장을 위해 nextTick 사용
          await nextTick()
          const messageIndex = messages.value.findIndex(msg => msg.id === assistantMessageId)
          if (messageIndex !== -1) {
            const currentMessage = messages.value[messageIndex]
            if (currentMessage) {
              console.log("[useChatState] 메시지 찾음, 업데이트 시작", {
                index: messageIndex,
                currentIsStreaming: currentMessage.isStreaming,
              })
              // 메시지 객체를 완전히 새로 생성하여 반응성 보장
              const updatedMessage: ChatMessage = {
                id: currentMessage.id,
                role: currentMessage.role,
                content: currentMessage.content || "",
                time: currentMessage.time,
                attachments: currentMessage.attachments,
                status: currentMessage.status,
                isStreaming: false,
              }
              // 배열을 새로 만들어서 할당
              const updatedMessages = [...messages.value]
              updatedMessages[messageIndex] = updatedMessage
              messages.value = updatedMessages
              // Vue가 업데이트를 처리할 시간을 줌
              await nextTick()
              console.log("[useChatState] 메시지 업데이트 완료", {
                newIsStreaming: updatedMessages[messageIndex]?.isStreaming,
                actualIsStreaming: messages.value[messageIndex]?.isStreaming,
              })
            } else {
              console.warn("[useChatState] 메시지를 찾을 수 없음", { messageIndex })
            }
          } else {
            console.warn("[useChatState] 메시지 인덱스를 찾을 수 없음", { assistantMessageId })
          }
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
        // onAlreadyCompleted: 같은 Idempotency-Key로 이미 완료된 요청 → 해당 대화로 이동
        async (conversationId: string) => {
          isWaitingForResponse.value = false
          const exists = threads.value.some((t) => t.conversationId === conversationId)
          if (!exists) {
            const newThread: ChatThread = {
              id: conversationId,
              title: "대화",
              active: true,
              conversationId,
            }
            threads.value = [
              newThread,
              ...threads.value.map((t) => ({ ...t, active: false })),
            ]
          }
          await selectThread(conversationId)
        },
        // file: 첨부 파일 전달
        fileToSend,
        idempotencyKey
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
    currentConversationId.value = null
    hasMoreMessages.value = true
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
    isLoadingMore,
    hasMoreMessages,
    sendMessage: sendMessage as (content?: string, attachments?: File[]) => void,
    retryMessage,
    startNewChat,
    selectThread,
    deleteThread,
    renameThread,
    loadMoreMessages,
  }
}
