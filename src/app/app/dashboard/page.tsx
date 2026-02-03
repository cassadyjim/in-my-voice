import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardTabs } from './components/DashboardTabs'
import Link from 'next/link'

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
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/app/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-slate-900">In My Voice</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/app/dashboard"
                  className="px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  href="/app/chat"
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Chat
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm text-slate-500">{user.email}</span>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit" className="text-slate-600">
                  Log Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardTabs
          activePrompt={activePrompt}
          allVersions={allVersions || []}
          userId={user.id}
        />
      </main>
    </div>
  )
}
