'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  // Refresh versions after changes (restore)
  const handleVersionsChanged = (newVersions: PromptVersion[], newActive: PromptVersion | null) => {
    setVersions(newVersions)
    setCurrentPrompt(newActive)
  }

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab promptVersion={currentPrompt} />
      </TabsContent>

      <TabsContent value="history">
        <HistoryTab
          versions={versions}
          userId={userId}
          onVersionRestored={handleVersionsChanged}
        />
      </TabsContent>
    </Tabs>
  )
}
