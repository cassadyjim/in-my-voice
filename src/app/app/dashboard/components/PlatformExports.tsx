'use client'

import { useState, useEffect } from 'react'
import { PLATFORM_INFO } from '@/lib/platform-prompts'
import type { PlatformExports as PlatformExportsType, PlatformName } from '@/types/chat'

export function PlatformExports() {
  const [exports, setExports] = useState<PlatformExportsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<PlatformName | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    loadExports()
  }, [])

  async function loadExports() {
    try {
      setLoading(true)
      const res = await fetch('/api/export-prompt')
      if (res.ok) {
        const data = await res.json()
        setExports(data.exports)
      } else {
        const errorData = await res.json()
        setError(errorData.error)
      }
    } catch (err) {
      setError('Failed to load platform exports')
    } finally {
      setLoading(false)
    }
  }

  async function regenerateExports() {
    try {
      setRegenerating(true)
      const res = await fetch('/api/export-prompt', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setExports(data.exports)
      }
    } catch (err) {
      console.error('Failed to regenerate exports:', err)
    } finally {
      setRegenerating(false)
    }
  }

  async function copyToClipboard(platform: PlatformName) {
    if (!exports?.[platform]) return

    try {
      await navigator.clipboard.writeText(exports[platform])
      setCopiedPlatform(platform)
      setTimeout(() => setCopiedPlatform(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-center text-slate-500">
          <p>{error}</p>
          <button
            onClick={loadExports}
            className="mt-2 text-slate-700 hover:underline font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const platforms: PlatformName[] = ['chatgpt', 'claude', 'copilot', 'gemini', 'generic']

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Export to Other Platforms</h3>
              <p className="text-xs text-slate-500">Copy your voice profile optimized for each AI</p>
            </div>
          </div>
          <button
            onClick={regenerateExports}
            disabled={regenerating}
            className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1.5 disabled:opacity-50 font-medium"
          >
            <svg
              className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Regenerate
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((platform) => {
            const info = PLATFORM_INFO[platform]
            const isCopied = copiedPlatform === platform

            return (
              <button
                key={platform}
                onClick={() => copyToClipboard(platform)}
                disabled={!exports?.[platform]}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border transition-all text-left
                  ${
                    isCopied
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <span className="text-2xl">{info.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{info.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {isCopied ? '✓ Copied!' : 'Click to copy'}
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 flex-shrink-0 ${isCopied ? 'text-emerald-500' : 'text-slate-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isCopied ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  )}
                </svg>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
