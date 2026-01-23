export type ChatRole = "assistant" | "user"

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
