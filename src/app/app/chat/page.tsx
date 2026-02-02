'use client'

import { useState, useEffect } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { ConversationSidebar } from './components/ConversationSidebar'
import type { Conversation } from '@/types/chat'

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleNewChat() {
    setActiveConversationId(null)
  }

  function handleConversationCreated(id: string) {
    setActiveConversationId(id)
    // Reload conversations to get the new one with its title
    loadConversations()
  }

  async function handleDeleteConversation(id: string) {
    try {
      const res = await fetch(`/api/conversations?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (activeConversationId === id) {
          setActiveConversationId(null)
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300
          fixed lg:relative inset-y-0 left-0 z-40
          w-72 border-r border-gray-200
        `}
      >
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onDelete={handleDeleteConversation}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
            <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎤</span>
              <span>In My Voice</span>
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            {activeConversationId ? (
              conversations.find((c) => c.id === activeConversationId)?.title || 'Chat'
            ) : (
              'New Chat'
            )}
          </div>
        </header>

        {/* Chat interface */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <ChatInterface
            conversationId={activeConversationId}
            onConversationCreated={handleConversationCreated}
          />
        )}
      </div>
    </div>
  )
}
