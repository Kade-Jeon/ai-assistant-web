import type {
  AssistantRequest,
  ChatThread,
  ChatMessage,
  ChatRole,
  UserConversationItemDto,
  ConversationMessageDto,
} from "@/types/chat"
import { extractCompleteJsonFromBuffer } from "@/lib/chatCompletionParser"

// API base URL - 환경 변수로 관리 가능
// 개발 환경에서 Vite 프록시를 사용하는 경우 빈 문자열 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "" : "http://localhost:8080")

/** 대화 목록/채팅 요청 시 사용하는 사용자 식별자 (환경변수 우선) */
const USER_ID = import.meta.env.VITE_USER_ID ?? "kade@thekade.com"

/** role 문자열을 ChatRole로 매핑 (system/tool은 assistant로 표시). 대소문자 무시(USER→user). */
const toChatRole = (role: string): ChatRole =>
  String(role).toLowerCase() === "user" ? "user" : "assistant"

/**
 * 서버 시각 → 브라우저 로케일·로컬 시간대로 표시.
 * - 현재 백엔드는 "한국 시간 기준 시각"을 ISO 형식으로 보내고 끝에 Z만 붙여 보냄(실제 UTC 아님).
 *   예: 26일 20:38 KST → "2026-01-26T20:38:33Z". Z를 제거하고 로컬로 파싱해 26일 오후 8:38로 표시.
 * - epoch ms/초 숫자도 지원.
 */
function formatTimestamp(timestamp: string | number | null | undefined): string {
  if (timestamp === null || timestamp === undefined || timestamp === "") return ""
  const raw = String(timestamp).trim()
  if (!raw) return ""

  let date: Date
  const asNum = Number(timestamp)
  if (typeof timestamp === "number" || (/^-?\d+$/.test(raw) && !Number.isNaN(asNum))) {
    const ms = asNum < 1e12 ? asNum * 1000 : asNum
    date = new Date(ms)
  } else {
    const isoWithZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?Z$/i.test(raw)
    if (isoWithZ) {
      date = new Date(raw.slice(0, -1))
    } else {
      const isoNoTz = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/i.test(raw)
      date = new Date(isoNoTz ? `${raw}Z` : raw)
    }
  }

  if (Number.isNaN(date.getTime())) return ""
  const locale = typeof navigator !== "undefined" ? navigator.language : undefined
  const dateStr = date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const timeStr = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${dateStr} ${timeStr}`
}

export const useApi = () => {
  /**
   * 대화 목록을 조회합니다.
   * GET /api/v1/ai/conv, USER-ID 헤더 필요.
   * 응답을 ChatThread 형태(id, title, active, conversationId)로 변환해 반환합니다.
   */
  const fetchChatThreads = async (): Promise<ChatThread[]> => {
    const url = `${API_BASE_URL}/api/v1/ai/conv`
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "USER-ID": USER_ID,
        },
      })

      if (!response.ok) {
        const message = response.status === 400
          ? "USER-ID 헤더를 제공해주세요."
          : `대화 목록 조회 실패 (${response.status})`
        throw new Error(message)
      }

      const data = (await response.json()) as UserConversationItemDto[]
      return (Array.isArray(data) ? data : []).map((item) => ({
        id: item.conversationId,
        title: item.subject,
        active: false,
        conversationId: item.conversationId,
      }))
    } catch (error) {
      if (error instanceof Error) throw error
      console.error("채팅방 목록 조회 실패:", error)
      throw new Error("채팅방 목록을 불러오는데 실패했습니다.")
    }
  }

  /**
   * 특정 대화방의 메시지 목록을 조회합니다.
   * GET /api/v1/ai/conv/{conversationId}, USER-ID 헤더 필요.
   * limit 쿼리는 사용하지 않습니다.
   */
  const fetchConversation = async (conversationId: string): Promise<ChatMessage[]> => {
    const url = `${API_BASE_URL}/api/v1/ai/conv/${encodeURIComponent(conversationId)}`
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "USER-ID": USER_ID,
        },
      })

      if (!response.ok) {
        const message = response.status === 400
          ? "USER-ID 헤더를 제공해주세요."
          : `대화 내용 조회 실패 (${response.status})`
        throw new Error(message)
      }

      const data = (await response.json()) as ConversationMessageDto[]
      const list = Array.isArray(data) ? data : []
      return list.map((msg, i) => ({
        id: `msg-${conversationId}-${i}`,
        role: toChatRole(msg.role),
        content: msg.content ?? "",
        time: formatTimestamp(msg.timestamp),
      }))
    } catch (error) {
      if (error instanceof Error) throw error
      console.error(`대화 내용 조회 실패 (${conversationId}):`, error)
      throw new Error("대화 내용을 불러오는데 실패했습니다.")
    }
  }

  /**
   * SSE 스트림 버퍼에서 conversation_created 이벤트를 찾아 파싱합니다.
   * 형식: event: conversation_created\ndata: {"conversationId":"...","subject":"..."}
   */
  const consumeConversationCreatedEvent = (
    buffer: string
  ): { item: UserConversationItemDto | null; remainingBuffer: string } => {
    const segments = buffer.split(/\n\n/)
    const last = segments.pop() ?? "";
    let item: UserConversationItemDto | null = null
    const kept: string[] = []

    for (const seg of segments) {
      const match = seg.match(/event:\s*conversation_created\s*\ndata:\s*([\s\S]*)/i)
      const dataPart = match?.[1]
      if (dataPart !== undefined) {
        try {
          const raw = dataPart.trim()
          const parsed = JSON.parse(raw) as UserConversationItemDto
          if (typeof parsed?.conversationId === "string" && typeof parsed?.subject === "string") {
            item = parsed
          } else {
            kept.push(seg)
          }
        } catch {
          kept.push(seg)
        }
      } else {
        kept.push(seg)
      }
    }

    const remainingBuffer = kept.length ? kept.join("\n\n") + "\n\n" + last : last
    return { item, remainingBuffer }
  }

  /**
   * SSE 스트리밍을 통해 채팅 메시지를 전송하고 응답을 받습니다.
   * @param request 채팅 요청 데이터
   * @param onMessage 스트림에서 메시지를 받을 때 호출되는 콜백
   * @param onError 에러 발생 시 호출되는 콜백
   * @param onComplete 스트림 완료 시 호출되는 콜백
   * @param onConversationCreated conversation_created SSE 이벤트 수신 시 호출 (선택)
   * @param file 첨부 파일 (있을 경우 multipart/form-data로 전송)
   */
  const sendChatMessage = async (
    request: AssistantRequest,
    onMessage: (data: string) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    onConversationCreated?: (item: UserConversationItemDto) => void,
    file?: File
  ): Promise<void> => {
    const url = `${API_BASE_URL}/api/v1/ai/conv`
    
    console.log("[SSE 요청 시작]", {
      url,
      method: "POST",
      body: request,
      hasFile: !!file,
      fileName: file?.name,
      apiBaseUrl: API_BASE_URL,
    })

    try {
      let requestBody: BodyInit
      let headers: HeadersInit

      const commonHeaders: HeadersInit = {
        Accept: "text/event-stream",
        "user-id": "kade@thekade.com",
      }

      if (file) {
        // 파일이 있는 경우: multipart/form-data로 전송
        const formData = new FormData()
        formData.append("file", file)
        formData.append("request", JSON.stringify(request))
        
        requestBody = formData
        // multipart/form-data의 경우 브라우저가 자동으로 Content-Type과 boundary를 설정하므로 명시하지 않음
        headers = commonHeaders
      } else {
        // 파일이 없는 경우: application/json으로 전송
        requestBody = JSON.stringify(request)
        headers = {
          ...commonHeaders,
          "Content-Type": "application/json",
        }
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
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
          // 마지막 버퍼에서 conversation_created 처리
          if (onConversationCreated) {
            let parsed = consumeConversationCreatedEvent(buffer)
            while (parsed.item) {
              onConversationCreated(parsed.item)
              parsed = consumeConversationCreatedEvent(parsed.remainingBuffer)
            }
            buffer = parsed.remainingBuffer
          }
          // 마지막 버퍼에 남은 콘텐츠 처리
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

        // SSE "event: conversation_created" + "data: {...}" 파싱 (대화방 생성 시 서버 전송)
        if (onConversationCreated) {
          let parsed = consumeConversationCreatedEvent(buffer)
          while (parsed.item) {
            onConversationCreated(parsed.item)
            parsed = consumeConversationCreatedEvent(parsed.remainingBuffer)
          }
          buffer = parsed.remainingBuffer
        }

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