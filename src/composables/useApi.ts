import type { AssistantRequest, ChatThread, ChatMessage } from "@/types/chat"
import { extractCompleteJsonFromBuffer } from "@/lib/chatCompletionParser"

// API base URL - 환경 변수로 관리 가능
// 개발 환경에서 Vite 프록시를 사용하는 경우 빈 문자열 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "" : "http://localhost:8080")

// 임시 mock 데이터 - 실제 백엔드 연동 시 교체 예정
const mockThreads: ChatThread[] = [
  {
    id: "t1",
    title: "프로덕트 전략 정리",
    active: true,
    conversationId: "conv_001"
  },
  {
    id: "t2",
    title: "Vue 성능 최적화 아이디어",
    active: false,
    conversationId: "conv_002"
  },
  {
    id: "t3",
    title: "디자인 시스템 톤앤매너",
    active: false,
    conversationId: "conv_003"
  },
  {
    id: "t4",
    title: "온보딩 플로우 개선",
    active: false,
    conversationId: "conv_004"
  },
]

// 시간 생성 헬퍼 함수
const createTimeString = (minutesAgo: number = 0) => {
  const now = new Date()
  const pastTime = new Date(now.getTime() - (minutesAgo * 60 * 1000))

  // 날짜 부분 (2025.01.23)
  const dateStr = pastTime.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).replace(/\./g, '').replace(/ /g, '.')

  // 시간 부분 (오전 11:14)
  const timeStr = pastTime.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${dateStr} ${timeStr}`
}

const mockConversations: Record<string, ChatMessage[]> = {
  "conv_001": [
    {
      id: "m1",
      role: "assistant",
      content: "안녕하세요! 프로덕트 전략 정리에 대해 무엇을 도와드릴까요?",
      time: createTimeString(5), // 5분 전
    },
    {
      id: "m2",
      role: "user",
      content: "현재 우리 서비스의 주요 경쟁사 분석을 하고 싶어요.",
      time: createTimeString(4), // 4분 전
    },
    {
      id: "m3",
      role: "assistant",
      content: "좋은 접근입니다. 경쟁사 분석을 위해서는 다음과 같은 항목들을 고려해야 합니다:\n\n1. 시장 점유율\n2. 주요 기능 비교\n3. 가격 정책\n4. 사용자 피드백\n5. 기술 스택\n\n어떤 측면부터 시작해볼까요?",
      time: createTimeString(2), // 2분 전
    },
  ],
  "conv_002": [
    {
      id: "m4",
      role: "assistant",
      content: "Vue 성능 최적화에 대해 이야기 나눠보죠. 어떤 부분에서 병목 현상이 발생하고 있나요?",
      time: createTimeString(15), // 15분 전
    },
    {
      id: "m5",
      role: "user",
      content: "리스트 렌더링이 느린 것 같아요. 수백 개의 아이템을 표시해야 하는데...",
      time: createTimeString(10), // 10분 전
    },
  ],
  "conv_003": [
    {
      id: "m6",
      role: "assistant",
      content: "디자인 시스템의 톤앤매너를 정의하는 것은 정말 중요합니다. 현재 브랜드의 성격을 어떻게 정의하고 있나요?",
      time: createTimeString(8), // 8분 전
    },
  ],
  "conv_004": [
    {
      id: "m7",
      role: "assistant",
      content: "온보딩 플로우 개선은 사용자 경험에 큰 영향을 미칩니다. 현재 어떤 문제가 있나요?",
      time: createTimeString(12), // 12분 전
    },
  ],
}

// 실제 API 호출처럼 약간의 지연을 주기 위한 헬퍼 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useApi = () => {
  /**
   * 채팅방 목록을 조회합니다.
   * 실제 백엔드에서는 /api/chat/threads 엔드포인트로 호출될 예정입니다.
   */
  const fetchChatThreads = async (): Promise<ChatThread[]> => {
    try {
      // 실제 API 호출 시뮬레이션
      await delay(500)

      // 임시 mock 데이터 반환
      return [...mockThreads]
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error)
      throw new Error('채팅방 목록을 불러오는데 실패했습니다.')
    }
  }

  /**
   * 특정 대화방의 메시지들을 조회합니다.
   * 실제 백엔드에서는 /api/chat/conversations/{conversationId} 엔드포인트로 호출될 예정입니다.
   */
  const fetchConversation = async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      // 실제 API 호출 시뮬레이션
      await delay(300)

      const messages = mockConversations[conversationId]
      if (!messages) {
        throw new Error(`대화방 ${conversationId}을 찾을 수 없습니다.`)
      }

      return [...messages]
    } catch (error) {
      console.error(`대화 내용 조회 실패 (${conversationId}):`, error)
      throw new Error('대화 내용을 불러오는데 실패했습니다.')
    }
  }

  /**
   * SSE 스트리밍을 통해 채팅 메시지를 전송하고 응답을 받습니다.
   * @param request 채팅 요청 데이터
   * @param onMessage 스트림에서 메시지를 받을 때 호출되는 콜백
   * @param onError 에러 발생 시 호출되는 콜백
   * @param onComplete 스트림 완료 시 호출되는 콜백
   */
  const sendChatMessage = async (
    request: AssistantRequest,
    onMessage: (data: string) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> => {
    const url = `${API_BASE_URL}/api/v1/ai/func`
    const requestBody = JSON.stringify(request)
    
    console.log("[SSE 요청 시작]", {
      url,
      method: "POST",
      body: request,
      apiBaseUrl: API_BASE_URL,
    })

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: requestBody,
      })

      console.log("[SSE 응답 받음]", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let connectedProcessed = false

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // 마지막 버퍼에 남은 데이터 처리
          if (buffer.trim()) {
            const { contents } = extractCompleteJsonFromBuffer(buffer)
            contents.forEach(content => {
              if (content) {
                onMessage(content)
              }
            })
          }
          onComplete?.()
          break
        }

        // 청크를 텍스트로 디코딩
        buffer += decoder.decode(value, { stream: true })

        // "connected" 문자열 처리 (최초 1회만)
        if (!connectedProcessed && buffer.toLowerCase().startsWith('connected')) {
          buffer = buffer.substring('connected'.length)
          connectedProcessed = true
        }

        // 완전한 JSON 객체들을 추출 및 파싱
        const { contents, remainingBuffer } = extractCompleteJsonFromBuffer(buffer)
        
        // 파싱된 내용들을 onMessage로 전달
        contents.forEach(content => {
          if (content) {
            onMessage(content)
          }
        })

        // 버퍼 업데이트 (불완전한 JSON은 남김)
        buffer = remainingBuffer
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error("알 수 없는 오류가 발생했습니다.")
      console.error("[SSE 스트리밍 오류]", {
        error: errorMessage,
        message: errorMessage.message,
        stack: errorMessage.stack,
        url,
      })
      onError?.(errorMessage as Error)
      throw errorMessage
    }
  }

  return {
    fetchChatThreads,
    fetchConversation,
    sendChatMessage,
  }
}