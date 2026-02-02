'use client'

import type { WritingMode } from '@/types/chat'
import { WRITING_MODE_LABELS } from '@/types/chat'

interface WritingModeSelectorProps {
  value: WritingMode
  onChange: (mode: WritingMode) => void
}

const MODE_ICONS: Record<WritingMode, string> = {
  general: '✨',
  email: '📧',
  linkedin: '💼',
  twitter: '🐦',
  slack: '💬',
  formal_letter: '📝',
}

export function WritingModeSelector({ value, onChange }: WritingModeSelectorProps) {
  const modes: WritingMode[] = [
    'general',
    'email',
    'linkedin',
    'twitter',
    'slack',
    'formal_letter',
  ]

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      <span className="text-sm text-gray-500 mr-2 flex-shrink-0">Writing:</span>
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0
            flex items-center gap-1.5
            ${
              value === mode
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          <span>{MODE_ICONS[mode]}</span>
          <span>{WRITING_MODE_LABELS[mode]}</span>
        </button>
      ))}
    </div>
  )
}
