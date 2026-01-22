export type ChatRole = "assistant" | "user"

export interface ChatThread {
  id: string
  title: string
  active: boolean
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  time: string
}
