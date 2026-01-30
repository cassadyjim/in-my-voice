'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import Link from 'next/link'

type Mode = 'A' | 'B' | 'C'

interface PlaygroundTabProps {
  promptText: string
}

const MODE_INFO = {
  A: {
    label: 'Casual',
    description: 'Team messages, quick updates, Slack',
    color: 'green',
    bgActive: 'bg-green-500',
    bgInactive: 'bg-green-100 hover:bg-green-200',
    textActive: 'text-white',
    textInactive: 'text-green-700',
  },
  B: {
    label: 'Professional',
    description: 'Clients, vendors, business partners',
    color: 'blue',
    bgActive: 'bg-blue-500',
    bgInactive: 'bg-blue-100 hover:bg-blue-200',
    textActive: 'text-white',
    textInactive: 'text-blue-700',
  },
  C: {
    label: 'Formal',
    description: 'Board, legal, official correspondence',
    color: 'purple',
    bgActive: 'bg-purple-500',
    bgInactive: 'bg-purple-100 hover:bg-purple-200',
    textActive: 'text-white',
    textInactive: 'text-purple-700',
  },
}

export function PlaygroundTab({ promptText }: PlaygroundTabProps) {
  const [selectedMode, setSelectedMode] = useState<Mode>('A')
  const [testInput, setTestInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!promptText) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🧪</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Test Playground
        </h3>
        <p className="text-slate-600 mb-6">
          Generate your voice profile first to test it here.
        </p>
        <Link href="/app/onboarding">
          <Button size="lg">Start Onboarding →</Button>
        </Link>
      </Card>
    )
  }

  const handleGenerate = async () => {
    if (!testInput.trim()) {
      toast.error('Please enter a test request')
      return
    }

    setLoading(true)
    setError('')
    setOutput('')

    try {
      const response = await fetch('/api/test-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          testRequest: testInput,
          promptText,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const { content } = await response.json()
      setOutput(content)
      toast.success('Content generated!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      toast.error('Generation failed', { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Test Playground</h2>
        <p className="text-slate-600">
          Try your IMV prompt in different modes to see how it sounds.
        </p>
      </div>

      {/* Mode Selector */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Select Voice Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['A', 'B', 'C'] as Mode[]).map((mode) => {
            const info = MODE_INFO[mode]
            const isActive = selectedMode === mode
            return (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`p-4 rounded-lg text-left transition-all ${
                  isActive
                    ? `${info.bgActive} ${info.textActive} shadow-md`
                    : `${info.bgInactive} ${info.textInactive}`
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-white/20' : 'bg-white'
                  }`}>
                    {mode}
                  </span>
                  <span className="font-semibold">{info.label}</span>
                </div>
                <p className={`text-xs ${isActive ? 'opacity-90' : 'opacity-70'}`}>
                  {info.description}
                </p>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Test Input */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-2">What do you want to write?</h3>
        <p className="text-sm text-slate-600 mb-4">
          Enter a request like "write an email to my team about the project delay"
        </p>
        <Textarea
          placeholder="e.g., Write an email to my team announcing a new project kickoff..."
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          className="min-h-[100px] mb-4"
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Mode: <span className="font-medium">{MODE_INFO[selectedMode].label}</span>
          </span>
          <Button onClick={handleGenerate} disabled={loading || !testInput.trim()}>
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              'Generate in My Voice →'
            )}
          </Button>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Output Display */}
      {output && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Generated Content</h3>
              <p className="text-sm text-slate-600">
                Written in {MODE_INFO[selectedMode].label} mode
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyOutput}>
              Copy
            </Button>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border">
            <p className="text-slate-800 whitespace-pre-wrap">{output}</p>
          </div>

          {/* Feedback */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-slate-600">How does this sound?</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Thanks for the feedback!')}
              >
                👍 Good
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Try the Refine tab to improve your prompt!')}
              >
                👎 Needs work
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          <strong>Tip:</strong> Try the same request in different modes to see how your voice adapts.
          If something doesn't sound right, use the Refine tab to adjust your prompt.
        </AlertDescription>
      </Alert>
    </div>
  )
}
