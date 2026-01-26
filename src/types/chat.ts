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

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  time: string
  attachments?: File[]
}
