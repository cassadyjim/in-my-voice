// Chat-related TypeScript types

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface PlatformExports {
  chatgpt: string
  claude: string
  copilot: string
  gemini: string
  generic: string
}

export type PlatformName = keyof PlatformExports

export interface ChatRequest {
  conversation_id?: string // If null, creates new conversation
  message: string
  temperature?: number
}

export interface ChatResponse {
  conversation_id: string
  message: Message
}
