'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getPromptPreview } from '@/lib/prompt-parser'
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

interface HistoryTabProps {
  versions: PromptVersion[]
  userId: string
  onVersionRestored: (versions: PromptVersion[], active: PromptVersion | null) => void
}

export function HistoryTab({ versions, userId, onVersionRestored }: HistoryTabProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [restoring, setRestoring] = useState<number | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  if (versions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">📜</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Version History
        </h3>
        <p className="text-slate-600 mb-6">
          No versions yet. Generate your first voice profile to start.
        </p>
        <Link href="/app/onboarding">
          <Button size="lg">Start Onboarding →</Button>
        </Link>
      </Card>
    )
  }

  const handleRestore = async (version: PromptVersion) => {
    if (version.is_active) {
      toast.info('This version is already active')
      return
    }

    setRestoring(version.id)
    setError('')

    try {
      // Deactivate all versions
      await supabase
        .from('prompt_versions')
        .update({ is_active: false })
        .eq('user_id', userId)

      // Activate selected version
      const { error: activateError } = await supabase
        .from('prompt_versions')
        .update({ is_active: true })
        .eq('id', version.id)

      if (activateError) throw activateError

      // Fetch updated versions
      const { data: updatedVersions } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('user_id', userId)
        .order('version_num', { ascending: false })

      const newActive = updatedVersions?.find(v => v.is_active) || null

      toast.success('Version restored!', {
        description: `Version ${version.version_num} is now active.`,
      })

      onVersionRestored(updatedVersions || [], newActive)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore version'
      setError(errorMessage)
      toast.error('Restore failed', { description: errorMessage })
    } finally {
      setRestoring(null)
    }
  }

  const handleCopy = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Version History</h2>
        <p className="text-slate-600">
          {versions.length} version{versions.length !== 1 ? 's' : ''} • Restore any previous version if needed
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Version List */}
      <div className="space-y-4">
        {versions.map((version) => {
          const isExpanded = expandedId === version.id
          const isRestoring = restoring === version.id
          const wasRefined = (version.generation_params as Record<string, unknown>)?.refinement === true
          const refinedFrom = (version.generation_params as Record<string, unknown>)?.refined_from as number | undefined

          return (
            <Card
              key={version.id}
              className={`p-6 transition-all ${
                version.is_active
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-200'
              }`}
            >
              {/* Version Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    version.is_active
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    v{version.version_num}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        Version {version.version_num}
                      </h3>
                      {version.is_active && (
                        <span className="px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                      {wasRefined && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Refined{refinedFrom ? ` from v${refinedFrom}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDate(version.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : version.id)}
                  >
                    {isExpanded ? 'Hide' : 'View'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(version.prompt_text)}
                  >
                    Copy
                  </Button>
                  {!version.is_active && (
                    <Button
                      size="sm"
                      onClick={() => handleRestore(version)}
                      disabled={isRestoring}
                    >
                      {isRestoring ? 'Restoring...' : 'Restore'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Preview (always visible) */}
              {!isExpanded && (
                <div className="ml-13 pl-13">
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {getPromptPreview(version.prompt_text, 150)}
                  </p>
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-4 p-4 bg-white rounded-lg border max-h-96 overflow-y-auto">
                  <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono">
                    {version.prompt_text}
                  </pre>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Tips */}
      {versions.length === 1 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            <strong>Tip:</strong> Use the Test tab to try your prompt, then use the Refine tab
            to improve it. Each refinement creates a new version you can restore later.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
