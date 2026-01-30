'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface PromptVersion {
  id: number
  user_id: string
  version_num: number
  prompt_text: string
  is_active: boolean
  generation_params: Record<string, unknown>
  created_at: string
}

interface RefineTabProps {
  currentPrompt: PromptVersion | null
  userId: string
  onVersionCreated: (versions: PromptVersion[], active: PromptVersion | null) => void
}

const GUIDED_QUESTIONS = [
  { id: 'casual', label: 'Make it more casual', description: 'Add more contractions, informal language' },
  { id: 'professional', label: 'Make it more professional', description: 'Polish the tone, reduce slang' },
  { id: 'concise', label: 'Be more concise', description: 'Shorter sentences, cut filler words' },
  { id: 'confident', label: 'Sound more confident', description: 'Stronger assertions, less hedging' },
  { id: 'friendly', label: 'Be warmer/friendlier', description: 'More personal touches, empathy' },
  { id: 'custom', label: 'Custom feedback', description: 'I\'ll write my own instructions' },
]

export function RefineTab({ currentPrompt, userId, onVersionCreated }: RefineTabProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')
  const [customFeedback, setCustomFeedback] = useState('')
  const [refinedPrompt, setRefinedPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const supabase = createClient()

  if (!currentPrompt) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🔧</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Refine Your Voice
        </h3>
        <p className="text-slate-600 mb-6">
          Generate your voice profile first to refine it here.
        </p>
        <Link href="/app/onboarding">
          <Button size="lg">Start Onboarding →</Button>
        </Link>
      </Card>
    )
  }

  const getFeedbackText = (): string => {
    if (selectedQuestion === 'custom') {
      return customFeedback
    }
    const question = GUIDED_QUESTIONS.find(q => q.id === selectedQuestion)
    return question ? `${question.label}: ${question.description}` : ''
  }

  const handleRefine = async () => {
    const feedback = getFeedbackText()
    if (!feedback.trim()) {
      toast.error('Please select a refinement option or enter custom feedback')
      return
    }

    setLoading(true)
    setError('')
    setRefinedPrompt('')
    setShowPreview(false)

    try {
      const response = await fetch('/api/refine-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
          currentPromptText: currentPrompt.prompt_text,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refine prompt')
      }

      const { refinedPrompt: newPrompt } = await response.json()
      setRefinedPrompt(newPrompt)
      setShowPreview(true)
      toast.success('Refinement ready!', {
        description: 'Review the changes below and save if you\'re happy.',
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      toast.error('Refinement failed', { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVersion = async () => {
    if (!refinedPrompt) return

    setSaving(true)
    setError('')

    try {
      // Deactivate current version
      await supabase
        .from('prompt_versions')
        .update({ is_active: false })
        .eq('user_id', userId)

      // Insert new version
      const newVersionNum = currentPrompt.version_num + 1
      const { data: newVersion, error: insertError } = await supabase
        .from('prompt_versions')
        .insert({
          user_id: userId,
          version_num: newVersionNum,
          prompt_text: refinedPrompt,
          is_active: true,
          generation_params: {
            model: 'gpt-4o',
            temperature: 0.7,
            refinement: true,
            refined_from: currentPrompt.version_num,
          },
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Fetch all versions for update
      const { data: allVersions } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('user_id', userId)
        .order('version_num', { ascending: false })

      toast.success('New version saved!', {
        description: `Version ${newVersionNum} is now active.`,
      })

      // Reset state
      setSelectedQuestion('')
      setCustomFeedback('')
      setRefinedPrompt('')
      setShowPreview(false)

      // Update parent
      onVersionCreated(allVersions || [], newVersion)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save version'
      setError(errorMessage)
      toast.error('Save failed', { description: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  const canRefine = selectedQuestion && (selectedQuestion !== 'custom' || customFeedback.trim().length >= 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Refine Your Voice</h2>
        <p className="text-slate-600">
          Improve your IMV prompt based on how it performs. Currently on v{currentPrompt.version_num}.
        </p>
      </div>

      {/* Guided Questions */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">What would you like to change?</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {GUIDED_QUESTIONS.map((question) => (
            <button
              key={question.id}
              onClick={() => {
                setSelectedQuestion(question.id)
                if (question.id !== 'custom') {
                  setCustomFeedback('')
                }
              }}
              className={`p-4 rounded-lg text-left transition-all border ${
                selectedQuestion === question.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-4 h-4 rounded-full border-2 ${
                  selectedQuestion === question.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-300'
                }`}>
                  {selectedQuestion === question.id && (
                    <span className="block w-2 h-2 m-0.5 bg-white rounded-full" />
                  )}
                </span>
                <span className="font-medium text-slate-900">{question.label}</span>
              </div>
              <p className="text-sm text-slate-600 ml-6">{question.description}</p>
            </button>
          ))}
        </div>

        {/* Custom Feedback Input */}
        {selectedQuestion === 'custom' && (
          <div className="mt-4">
            <Textarea
              placeholder="Describe what you'd like to change... (minimum 10 characters)&#10;&#10;Examples:&#10;- Use more em-dashes and parenthetical asides&#10;- Start emails with 'Hey' instead of 'Hi'&#10;- Sound less formal in casual mode"
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-sm text-slate-500 mt-2">
              {customFeedback.length} / 10 minimum characters
            </p>
          </div>
        )}

        {/* Refine Button */}
        <div className="mt-6">
          <Button
            onClick={handleRefine}
            disabled={!canRefine || loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Refining...
              </>
            ) : (
              'Preview Refinement →'
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

      {/* Preview */}
      {showPreview && refinedPrompt && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-green-900">Refined Prompt Preview</h3>
              <p className="text-sm text-green-700">
                Review the changes before saving as v{currentPrompt.version_num + 1}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPreview(false)
                  setRefinedPrompt('')
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveVersion}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Saving...' : 'Save as New Version'}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-200 max-h-80 overflow-y-auto">
            <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono">
              {refinedPrompt}
            </pre>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          <strong>Tip:</strong> Test your current prompt in the Playground tab first.
          Note what doesn't sound right, then come back here to refine it.
        </AlertDescription>
      </Alert>
    </div>
  )
}
