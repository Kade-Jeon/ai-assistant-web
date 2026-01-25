export type ChatRole = "assistant" | "user"

export enum PromptType {
  CONVERSATION = "CONVERSATION",
}

export interface AssistantRequest {
  promptType: PromptType
  question: string
  language?: string
  targetType?: string
  toneType?: string
  userId?: string
  sessionId?: string
  tenant?: string
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
