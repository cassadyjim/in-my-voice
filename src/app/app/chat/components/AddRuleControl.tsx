'use client'

import { useState } from 'react'

interface AddRuleControlProps {
  onRuleAdded?: () => void
}

export function AddRuleControl({ onRuleAdded }: AddRuleControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [ruleType, setRuleType] = useState<'avoid' | 'prefer'>('avoid')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async () => {
    if (!phrase.trim()) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/prompt/add-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrase: phrase.trim(),
          rule_type: ruleType,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setPhrase('')
        onRuleAdded?.()
        // Auto-close after success
        setTimeout(() => {
          setIsOpen(false)
          setMessage(null)
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add rule' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors flex items-center gap-1"
        title="Flag a word or phrase to improve your voice profile"
      >
        <span>🚫</span>
        <span>Flag phrase</span>
      </button>
    )
  }

  return (
    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-orange-800">Add to your voice rules</span>
        <button
          onClick={() => {
            setIsOpen(false)
            setMessage(null)
            setPhrase('')
          }}
          className="text-orange-600 hover:text-orange-800"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setRuleType('avoid')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            ruleType === 'avoid'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🚫 Avoid
        </button>
        <button
          onClick={() => setRuleType('prefer')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            ruleType === 'prefer'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          ✓ Prefer
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={ruleType === 'avoid' ? "Word or phrase to avoid..." : "Word or phrase to use more..."}
          className="flex-1 px-3 py-1.5 text-sm border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={!phrase.trim() || isSubmitting}
          className="px-3 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '...' : 'Add'}
        </button>
      </div>

      {message && (
        <div className={`mt-2 text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </div>
      )}

      <p className="mt-2 text-xs text-orange-600">
        {ruleType === 'avoid'
          ? "This phrase won't be used in future responses."
          : "This phrase will be used naturally when appropriate."}
      </p>
    </div>
  )
}
