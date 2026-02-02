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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>{error}</p>
          <button
            onClick={loadExports}
            className="mt-2 text-purple-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const platforms: PlatformName[] = ['chatgpt', 'claude', 'copilot', 'gemini', 'generic']

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Export to Other Platforms
        </h3>
        <button
          onClick={regenerateExports}
          disabled={regenerating}
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
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

      <p className="text-sm text-gray-500 mb-4">
        Copy your IMV prompt optimized for each platform
      </p>

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
                flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left
                ${
                  isCopied
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <span className="text-2xl">{info.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800">{info.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {isCopied ? '✓ Copied!' : info.description}
                </div>
              </div>
              <svg
                className={`w-5 h-5 flex-shrink-0 ${isCopied ? 'text-green-500' : 'text-gray-400'}`}
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

      <div className="mt-4 pt-4 border-t border-gray-100">
        <a
          href="/app/chat"
          className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
        >
          <span>Or use the built-in chat</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  )
}
