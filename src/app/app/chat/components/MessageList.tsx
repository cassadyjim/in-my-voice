'use client'

import { useState } from 'react'
import { MessageModifyControls, type ModificationType } from './MessageModifyControls'
import type { Message } from '@/types/chat'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  conversationId: string | null
  onMessageModified: (newMessage: Message) => void
}

export function MessageList({
  messages,
  isLoading,
  conversationId,
  onMessageModified,
}: MessageListProps) {
  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          conversationId={conversationId}
          onMessageModified={onMessageModified}
          isLatestAssistant={
            message.role === 'assistant' &&
            index === messages.length - 1
          }
        />
      ))}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm">
            🎤
          </div>
          <div className="flex-1">
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 inline-block">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  conversationId: string | null
  onMessageModified: (newMessage: Message) => void
  isLatestAssistant: boolean
}

function MessageBubble({
  message,
  conversationId,
  onMessageModified,
  isLatestAssistant,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [isModifying, setIsModifying] = useState(false)
  const [modifyError, setModifyError] = useState<string | null>(null)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleModify = async (type: ModificationType) => {
    console.log('Modify requested:', { type, conversationId, messageId: message.id })

    if (!conversationId) {
      console.error('No conversation ID - cannot modify')
      setModifyError('No conversation selected')
      return
    }
    if (isModifying) return

    setIsModifying(true)
    setModifyError(null)

    try {
      console.log('Sending modify request...')
      const res = await fetch('/api/chat/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          original_content: message.content,
          modification_type: type,
        }),
      })

      const data = await res.json()
      console.log('Modify response:', { ok: res.ok, status: res.status, data })

      if (!res.ok) {
        console.error('Modify API error:', data)
        setModifyError(data.error || 'Failed to modify')
        return
      }

      if (data.message) {
        console.log('Calling onMessageModified with:', data.message)
        onMessageModified(data.message)
      } else {
        console.error('No message in response:', data)
        setModifyError('Invalid response from server')
      }
    } catch (err) {
      console.error('Failed to modify:', err)
      setModifyError('Network error - please try again')
    } finally {
      setIsModifying(false)
    }
  }

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="flex-1 flex justify-end">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium flex-shrink-0">
          You
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm flex-shrink-0">
        🎤
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 relative group">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>

          {/* Copy button - shows on hover */}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Modification controls - always visible */}
          <MessageModifyControls
            onModify={handleModify}
            isLoading={isModifying}
          />

          {/* Error display */}
          {modifyError && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              {modifyError}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-400 mt-1 ml-1">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
