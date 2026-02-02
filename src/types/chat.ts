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
  writing_mode?: WritingMode
}

export interface ChatResponse {
  conversation_id: string
  message: Message
}

export type WritingMode =
  | 'general'
  | 'email'
  | 'linkedin'
  | 'twitter'
  | 'slack'
  | 'formal_letter'

export const WRITING_MODE_LABELS: Record<WritingMode, string> = {
  general: 'General',
  email: 'Email',
  linkedin: 'LinkedIn Post',
  twitter: 'Tweet/Thread',
  slack: 'Slack Message',
  formal_letter: 'Formal Letter',
}

export const WRITING_MODE_DESCRIPTIONS: Record<WritingMode, string> = {
  general: 'General writing in your voice',
  email: 'Professional or casual emails',
  linkedin: 'LinkedIn posts and articles',
  twitter: 'Tweets and Twitter threads',
  slack: 'Slack messages and updates',
  formal_letter: 'Formal business letters',
}
