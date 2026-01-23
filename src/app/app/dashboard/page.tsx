import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome to In My Voice! 👋
          </h2>
          <p className="text-slate-600">
            Let's get started by analyzing your writing style.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Onboarding Card */}
          <Card className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Add Your Writing</h3>
                <p className="text-slate-600 mb-4">
                  Share 10-20 examples of your emails, messages, or documents so we can learn your voice.
                </p>
                <Link href="/app/onboarding">
                  <Button size="lg">
                    Start Onboarding →
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Status Card */}
          <Card className="p-6 bg-slate-50">
            <h3 className="font-semibold mb-3">Your Progress</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                <span className="text-slate-600">Writing samples: 0</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                <span className="text-slate-600">IMV prompt: Not generated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                <span className="text-slate-600">Version: —</span>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 border-blue-200 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 How It Works
            </h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li>1. Paste examples of your writing (emails, messages, posts)</li>
              <li>2. We analyze your tone, style, and voice patterns</li>
              <li>3. You get a personalized IMV prompt to use in any AI tool</li>
              <li>4. Copy it into ChatGPT, Claude, or Copilot and type "IMV"</li>
            </ol>
          </Card>
        </div>
      </main>
    </div>
  )
}
