'use client'

import { useState } from 'react'
import { ProfileTab } from './ProfileTab'
import { HistoryTab } from './HistoryTab'

interface PromptVersion {
  id: number
  user_id: string
  version_num: number
  prompt_text: string
  is_active: boolean
  generation_params: Record<string, unknown>
  created_at: string
}

interface DashboardTabsProps {
  activePrompt: PromptVersion | null
  allVersions: PromptVersion[]
  userId: string
}

export function DashboardTabs({ activePrompt, allVersions, userId }: DashboardTabsProps) {
  const [versions, setVersions] = useState<PromptVersion[]>(allVersions)
  const [currentPrompt, setCurrentPrompt] = useState<PromptVersion | null>(activePrompt)
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile')

  // Refresh versions after changes (restore)
  const handleVersionsChanged = (newVersions: PromptVersion[], newActive: PromptVersion | null) => {
    setVersions(newVersions)
    setCurrentPrompt(newActive)
  }

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <ProfileTab promptVersion={currentPrompt} />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          versions={versions}
          userId={userId}
          onVersionRestored={handleVersionsChanged}
        />
      )}
    </div>
  )
}
