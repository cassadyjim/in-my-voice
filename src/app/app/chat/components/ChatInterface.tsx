'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { WritingModeSelector } from './WritingModeSelector'
import { CreativitySlider } from './CreativitySlider'
import type { Message, Conversation, WritingMode } from '@/types/chat'

interface ChatInterfaceProps {
  conversationId: string | null
  onConversationCreated: (id: string) => void
}

export function ChatInterface({
  conversationId,
  onConversationCreated,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [writingMode, setWritingMode] = useState<WritingMode>('general')
  const [creativity, setCreativity] = useState(0.7)
  const [currentConvId, setCurrentConvId] = useState<string | null>(conversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update currentConvId when conversationId prop changes
  useEffect(() => {
    setCurrentConvId(conversationId)
  }, [conversationId])

  // Load conversation messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      setMessages([])
    }
  }, [conversationId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/conversations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }

  async function handleSendMessage(content: string) {
    if (!content.trim() || isLoading) return

    setError(null)
    setIsLoading(true)

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConvId || '',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: currentConvId,
          message: content,
          writing_mode: writingMode,
          temperature: creativity,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await res.json()

      // If this was a new conversation, update state and notify parent
      if (!currentConvId && data.conversation_id) {
        setCurrentConvId(data.conversation_id)
        onConversationCreated(data.conversation_id)
      }

      // Update messages with actual user message ID and add assistant response
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === tempUserMessage.id
            ? { ...m, id: `user-${Date.now()}`, conversation_id: data.conversation_id }
            : m
        )
        return [...updated, data.message]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  function handleMessageModified(newMessage: Message) {
    setMessages((prev) => [...prev, newMessage])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls Bar */}
      <div className="border-b border-gray-200 px-4 py-2 flex flex-wrap items-center gap-4">
        <WritingModeSelector
          value={writingMode}
          onChange={setWritingMode}
        />
        <div className="h-6 w-px bg-gray-200 hidden sm:block" />
        <CreativitySlider
          value={creativity}
          onChange={setCreativity}
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="text-6xl mb-4">🎤</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Write in Your Voice
            </h2>
            <p className="max-w-md">
              Your IMV prompt is automatically applied to every message.
              Just describe what you want to write, and I'll create it in your unique voice.
            </p>
            <div className="mt-6 text-sm text-gray-400">
              Try: "Write an email to my team about the project deadline"
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            conversationId={currentConvId}
            onMessageModified={handleMessageModified}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <MessageInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder={`Describe what you want to write (${writingMode === 'general' ? 'any format' : writingMode})...`}
        />
      </div>
    </div>
  )
}
