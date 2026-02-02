'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { parsePrompt, formatDate, type ParsedPrompt } from '@/lib/prompt-parser'
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

export function ProfileTab({ promptVersion }: ProfileTabProps) {
  const [showFullPrompt, setShowFullPrompt] = useState(false)

  if (!promptVersion) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">✨</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          No Voice Profile Yet
        </h3>
        <p className="text-slate-600 mb-6">
          Add your writing samples to generate your personalized IMV prompt.
        </p>
        <Link href="/app/onboarding">
          <Button size="lg">Start Onboarding →</Button>
        </Link>
      </Card>
    )
  }

  const parsed = parsePrompt(promptVersion.prompt_text)

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
    <div className="space-y-6">
      {/* Header with version info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Voice Profile</h2>
          <p className="text-slate-600">
            Version {promptVersion.version_num} • Generated {formatDate(promptVersion.created_at)}
          </p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          Active
        </span>
      </div>

      {/* Full Prompt Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Your IMV Prompt</h3>
            <p className="text-sm text-slate-600">Copy this and paste it into any AI assistant</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFullPrompt(!showFullPrompt)}>
              {showFullPrompt ? 'Hide' : 'Show Full'}
            </Button>
            <Button size="sm" onClick={handleCopyPrompt}>
              Copy Prompt
            </Button>
          </div>
        </div>

        {showFullPrompt && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border max-h-96 overflow-y-auto">
            <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono">
              {promptVersion.prompt_text}
            </pre>
          </div>
        )}

        <Alert className="mt-4 bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            <strong>How to use:</strong> Paste this prompt into ChatGPT, Claude, or Copilot.
            Then add "IMV" to any request, and the AI will write in your voice!
          </AlertDescription>
        </Alert>
      </Card>

      {/* Voice Analysis Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tone Analysis */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-lg">🎯</span> Tone Analysis
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {parsed.coreVoice.toneAnalysis}
          </p>
        </Card>

        {/* Vocabulary Signatures */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-lg">💬</span> Vocabulary Signatures
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {parsed.coreVoice.vocabularySignatures}
          </p>
        </Card>

        {/* Anti-Patterns */}
        <Card className="p-6 md:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-lg">🚫</span> Things to Avoid
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {parsed.coreVoice.antiPatterns}
          </p>
        </Card>
      </div>

      {/* Mode Examples */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Voice Modes</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Casual Mode */}
          <Card className="p-6 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">A</span>
              <h4 className="font-semibold text-green-900">Casual / Internal</h4>
            </div>
            <p className="text-sm text-green-800 mb-2">Team messages, quick updates, Slack</p>
            {parsed.modes.casual.example && parsed.modes.casual.example !== 'No example available' && (
              <div className="mt-3 p-3 bg-white rounded border border-green-200">
                <p className="text-xs text-slate-500 mb-1">Example:</p>
                <p className="text-sm text-slate-700 italic">{parsed.modes.casual.example.slice(0, 150)}...</p>
              </div>
            )}
          </Card>

          {/* Professional Mode */}
          <Card className="p-6 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">B</span>
              <h4 className="font-semibold text-blue-900">Professional / External</h4>
            </div>
            <p className="text-sm text-blue-800 mb-2">Clients, vendors, business partners</p>
            {parsed.modes.professional.example && parsed.modes.professional.example !== 'No example available' && (
              <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                <p className="text-xs text-slate-500 mb-1">Example:</p>
                <p className="text-sm text-slate-700 italic">{parsed.modes.professional.example.slice(0, 150)}...</p>
              </div>
            )}
          </Card>

          {/* Formal Mode */}
          <Card className="p-6 border-purple-200 bg-purple-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">C</span>
              <h4 className="font-semibold text-purple-900">Formal / Executive</h4>
            </div>
            <p className="text-sm text-purple-800 mb-2">Board, legal, official correspondence</p>
            {parsed.modes.formal.example && parsed.modes.formal.example !== 'No example available' && (
              <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                <p className="text-xs text-slate-500 mb-1">Example:</p>
                <p className="text-sm text-slate-700 italic">{parsed.modes.formal.example.slice(0, 150)}...</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Platform Exports */}
      <PlatformExports />

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-purple-900">Ready to write?</h3>
            <p className="text-sm text-purple-700">Use IMV Chat to write content in your voice</p>
          </div>
          <Link href="/app/chat">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              Open IMV Chat →
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
