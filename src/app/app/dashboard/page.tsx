import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardTabs } from './components/DashboardTabs'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch active prompt
  const { data: activePrompt } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  // Fetch all versions for history
  const { data: allVersions } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('user_id', user.id)
    .order('version_num', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-blue-600">IMV</h1>
            <span className="text-slate-600">Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.email}</span>
            <form action="/auth/signout" method="post">
              <Button variant="outline" type="submit">
                Log Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <DashboardTabs
          activePrompt={activePrompt}
          allVersions={allVersions || []}
          userId={user.id}
        />
      </main>
    </div>
  )
}
