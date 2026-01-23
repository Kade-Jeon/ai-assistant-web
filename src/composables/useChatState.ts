import { computed, ref } from "vue"
import type { ChatMessage, ChatThread } from "@/types/chat"

const createTimeLabel = () =>
  new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })

const createId = () => crypto.randomUUID()

const createSeedMessages = (): ChatMessage[] => [
  {
    id: createId(),
    role: "assistant",
    content: "안녕하세요! 무엇을 도와드릴까요?\n원하는 스타일이나 기능이 있다면 알려주세요.",
    time: "방금 전",
  },
  {
    id: createId(),
    role: "user",
    content: "ChatGPT처럼 보이는 화면을 만들고 싶어요.",
    time: "1분 전",
  },
  {
    id: createId(),
    role: "assistant",
    content: "좋아요. 사이드바, 상단 헤더, 메시지 리스트, 입력 영역으로 구성해 깔끔하게 정리해드릴게요.",
    time: "방금 전",
  },
]

const createSeedThreads = (): ChatThread[] => [
  { id: "t1", title: "프로덕트 전략 정리", active: true },
  { id: "t2", title: "Vue 성능 최적화 아이디어", active: false },
  { id: "t3", title: "디자인 시스템 톤앤매너", active: false },
  { id: "t4", title: "온보딩 플로우 개선", active: false },
]

export const useChatState = () => {
  const threads = ref<ChatThread[]>(createSeedThreads())
  const messages = ref<ChatMessage[]>(createSeedMessages())
  const messageInput = ref("")

  const canSend = computed(() => messageInput.value.trim().length > 0)

  const sendMessage = (content?: string, attachments?: File[]) => {
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
    }, 1000) // 1초 후 응답
  }

  const startNewChat = () => {
    threads.value = threads.value.map((thread, index) => ({
      ...thread,
      active: index === 0,
    }))
    messages.value = []
    messageInput.value = ""
  }

  return {
    canSend,
    messageInput,
    messages,
    threads,
    sendMessage: sendMessage as (content?: string) => void,
    startNewChat,
  }
}
