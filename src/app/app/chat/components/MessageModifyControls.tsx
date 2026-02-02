'use client'

import { useState } from 'react'
import type { ModificationType } from '@/lib/modification-prompts'

export type { ModificationType }

interface MessageModifyControlsProps {
  onModify: (type: ModificationType) => void
  isLoading: boolean
}

const MODIFY_OPTIONS: { type: ModificationType; label: string; icon: string }[] = [
  { type: 'shorter', label: 'Shorter', icon: '📉' },
  { type: 'longer', label: 'Longer', icon: '📈' },
  { type: 'more_casual', label: 'Casual', icon: '😊' },
  { type: 'more_professional', label: 'Professional', icon: '👔' },
  { type: 'more_like_me', label: 'More like me', icon: '🎯' },
  { type: 'clearer', label: 'Clearer', icon: '💡' },
]

const AUDIENCE_OPTIONS: { type: ModificationType; label: string }[] = [
  { type: 'audience_team', label: 'Team' },
  { type: 'audience_client', label: 'Client' },
  { type: 'audience_executive', label: 'Executive' },
]

export function MessageModifyControls({ onModify, isLoading }: MessageModifyControlsProps) {
  const [showAudience, setShowAudience] = useState(false)

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="flex flex-wrap gap-1.5">
        {/* Main modification buttons */}
        {MODIFY_OPTIONS.map((option) => (
          <button
            key={option.type}
            onClick={() => onModify(option.type)}
            disabled={isLoading}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}

        {/* Audience dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAudience(!showAudience)}
            disabled={isLoading}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span>👥</span>
            <span>Audience</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAudience && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[100px]">
              {AUDIENCE_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => {
                    onModify(option.type)
                    setShowAudience(false)
                  }}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-purple-50 hover:text-purple-700"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rewrite button */}
        <button
          onClick={() => onModify('rewrite')}
          disabled={isLoading}
          className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span>🔄</span>
          <span>Rewrite</span>
        </button>
      </div>

      {isLoading && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Modifying...
        </div>
      )}
    </div>
  )
}
