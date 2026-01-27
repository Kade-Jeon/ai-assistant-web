export type ChatRole = "assistant" | "user"

export enum PromptType {
  CONVERSATION = "CONVERSATION",
}

/** 채팅 전송 요청 (백엔드 AssistantRequest). 새 대화는 conversationId 없음, 기존 대화는 conversationId 포함 */
export interface AssistantRequest {
  promptType: PromptType
  question: string
  conversationId?: string
}

/** 백엔드 대화 목록 한 건 (GET /api/v1/ai/conv 응답 항목) */
export interface UserConversationItemDto {
  conversationId: string
  subject: string
}

/** 백엔드 대화 메시지 한 건 (GET /api/v1/ai/conv/{id} 응답 항목) */
export interface ConversationMessageDto {
  role: string // user | assistant | system | tool
  content: string
  /** ISO-8601 문자열 또는 epoch ms/초 (Java Instant 직렬화 방식에 따라 다름) */
  timestamp: string | number
}

export interface ChatThread {
  id: string
  title: string
  active: boolean
  conversationId: string
}

/** 사용자 메시지 전송 상태 (assistant 메시지에는 사용 안 함) */
export type MessageSendStatus = "sending" | "sent" | "failed"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  time: string
  attachments?: File[]
  /** 사용자 메시지 한정: 전송 중/완료/실패. 없으면 과거 로드 메시지 등 */
  status?: MessageSendStatus
}
