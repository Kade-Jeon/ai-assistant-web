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

/** 백엔드 첨부파일 메타데이터 (서버 응답) */
export interface AttachmentMeta {
  filename: string
  mimeType: string
  size: number
  createdAt: string
}

/** 백엔드 대화 메시지 한 건 (GET /api/v1/ai/conv/{id} 응답 항목) */
export interface ConversationMessageDto {
  role: string // user | assistant | system | tool
  content: string
  /** ISO-8601 문자열 또는 epoch ms/초 (Java Instant 직렬화 방식에 따라 다름) */
  timestamp: string | number
  /** 첨부파일 메타데이터 배열 (없으면 null) */
  attachments?: AttachmentMeta[] | null
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
  /** 첨부파일: File 객체(새로 보낼 때) 또는 AttachmentMeta(서버에서 불러올 때) */
  attachments?: (File | AttachmentMeta)[]
  /** 사용자 메시지 한정: 전송 중/완료/실패. 없으면 과거 로드 메시지 등 */
  status?: MessageSendStatus
  /** Assistant 메시지 한정: 스트리밍 중인지 여부 */
  isStreaming?: boolean
}
