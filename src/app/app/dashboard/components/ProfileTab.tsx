'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { PlatformExports } from './PlatformExports'

interface PromptVersion {
  id: number
  user_id: string
  version_num: number
  prompt_text: string
  is_active: boolean
  generation_params: Record<string, unknown>
  created_at: string
}

interface ProfileTabProps {
  promptVersion: PromptVersion | null
}

// Extract a voice summary from the prompt text
function extractVoiceSummary(promptText: string): string {
  // Try to find the Voice Identity section
  const identityMatch = promptText.match(/## 1\. VOICE IDENTITY[^\n]*\n([\s\S]*?)(?=##|$)/i)
  if (identityMatch) {
    const identityText = identityMatch[1].trim()
    const sentences = identityText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && !s.startsWith('-') && !s.startsWith('•'))
      .slice(0, 3)
    if (sentences.length > 0) {
      return sentences.join('. ') + '.'
    }
  }

  // Fallback: try Core Voice Foundation
  const coreMatch = promptText.match(/## 2\. CORE VOICE FOUNDATION[^\n]*\n([\s\S]*?)(?=##|$)/i)
  if (coreMatch) {
    const coreText = coreMatch[1].trim()
    const lines = coreText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('#'))
      .slice(0, 3)
    if (lines.length > 0) {
      return lines.join(' ').substring(0, 300) + '...'
    }
  }

  return 'Your personalized voice profile captures your unique writing style, tone, and communication patterns.'
}

// Get first N lines of prompt for preview
function getPromptPreview(promptText: string, lines: number = 4): string {
  return promptText
    .split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, lines)
    .join('\n')
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ProfileTab({ promptVersion }: ProfileTabProps) {
  const [showFullPrompt, setShowFullPrompt] = useState(false)

  // No prompt saved yet - show create button
  if (!promptVersion) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Welcome Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome to In My Voice</h1>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto text-lg">
            Create your personalized voice profile to start writing content that sounds authentically like you.
          </p>
          <Link href="/app/onboarding">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8 h-12 text-base">
              Create Your Voice Profile
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const voiceSummary = extractVoiceSummary(promptVersion.prompt_text)
  const promptPreview = getPromptPreview(promptVersion.prompt_text, 4)

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptVersion.prompt_text)
      toast.success('Copied to clipboard!', {
        description: 'Paste this into ChatGPT, Claude, or any AI tool.',
      })
    } catch {
      toast.error('Failed to copy', {
        description: 'Please select and copy the text manually.',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Primary CTA - Start Writing */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="text-white">
              <h2 className="text-xl font-semibold">Start Writing in Your Voice</h2>
              <p className="text-slate-400 text-sm mt-1">
                Create emails, messages, and content that sounds like you
              </p>
            </div>
          </div>
          <Link href="/app/chat">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-6 h-11 whitespace-nowrap">
              Open IMV Chat
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>

      {/* Voice Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">My Voice Summary</h3>
            <p className="text-xs text-slate-500">How your writing style is captured</p>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed">
          {voiceSummary}
        </p>
      </div>

      {/* IMV Prompt Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">Your IMV Prompt</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                  v{promptVersion.version_num}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Generated {formatDate(promptVersion.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
                className="text-slate-600"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </Button>
              <Link href="/app/onboarding">
                <Button variant="outline" size="sm" className="text-slate-600">
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Prompt Preview */}
        <div
          className={`bg-slate-50 p-4 font-mono text-sm text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors ${
            showFullPrompt ? 'max-h-96 overflow-y-auto' : 'max-h-32 overflow-hidden'
          }`}
          onClick={() => setShowFullPrompt(!showFullPrompt)}
        >
          <pre className="whitespace-pre-wrap">
            {showFullPrompt ? promptVersion.prompt_text : promptPreview}
          </pre>
          {!showFullPrompt && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-sans flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Click to expand full prompt
              </span>
            </div>
          )}
        </div>

        {showFullPrompt && (
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button
              onClick={() => setShowFullPrompt(false)}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Collapse
            </button>
          </div>
        )}

        <div className="p-4 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-blue-700">
            <strong className="font-medium">Tip:</strong> Copy this prompt into ChatGPT, Claude, or Copilot to write in your voice on any platform.
          </p>
        </div>
      </div>

      {/* Platform Exports */}
      <PlatformExports />
    </div>
  )
}
