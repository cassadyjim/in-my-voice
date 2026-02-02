'use client'

import { useState } from 'react'

export type ModificationType =
  | 'shorter'
  | 'longer'
  | 'more_casual'
  | 'more_professional'
  | 'more_like_me'
  | 'clearer'
  | 'audience_team'
  | 'audience_client'
  | 'audience_executive'
  | 'rewrite'

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

// Modification prompts for the API
export const MODIFICATION_PROMPTS: Record<ModificationType, string> = {
  shorter: 'Make this shorter and more concise while keeping the key points. Reduce by about 30-50%.',
  longer: 'Expand this with more detail, examples, or context. Add about 30-50% more content.',
  more_casual: 'Rewrite this in a more casual, friendly tone. Use contractions, simpler words, and a conversational style.',
  more_professional: 'Rewrite this in a more professional, polished tone. Use formal language and business-appropriate phrasing.',
  more_like_me: 'Rewrite this to sound even more like my natural voice. Emphasize my signature phrases and writing patterns from my IMV profile.',
  clearer: 'Rewrite this to be clearer and easier to understand. Simplify complex sentences and improve the flow.',
  audience_team: 'Adapt this for an internal team audience. Keep it friendly but focused, assuming familiarity with context.',
  audience_client: 'Adapt this for a client audience. Be professional, clear, and ensure it reflects well on our organization.',
  audience_executive: 'Adapt this for an executive audience. Be concise, focus on key takeaways, and use a formal tone.',
  rewrite: 'Generate a completely fresh version of this with the same intent but different wording and structure.',
}
