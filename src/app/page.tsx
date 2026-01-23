import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  // Check if user is already logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // If logged in, redirect to dashboard
  if (user) {
    redirect('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">IMV</div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/login">
              <Button>Try Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
            AI Writing in Your Authentic Voice
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            Your AI Assistant.
            <br />
            <span className="text-blue-600">YOUR Voice.</span>
          </h1>
          
          <p className="text-xl text-slate-600 leading-relaxed">
            Stop editing AI to sound like you. IMV analyzes your writing and creates a reusable prompt that makes any AI tool write in your authentic voice.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6">
                Try Free - No Credit Card
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              See How It Works
            </Button>
          </div>

          <p className="text-sm text-slate-500">
            ✓ Works with ChatGPT, Claude, and Copilot • ✓ 2-minute setup • ✓ Use forever
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-slate-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
            Does Your AI Writing Sound Like... AI?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 bg-white">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h3 className="font-bold text-lg mb-2">Generic ChatGPT</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                "I hope this email finds you well. I wanted to reach out regarding the opportunity to discuss..."
              </p>
              <p className="text-xs text-slate-500 mt-4">
                234 words • Overly formal • Obvious AI
              </p>
            </Card>

            <Card className="p-6 bg-white border-2 border-blue-500">
              <div className="text-green-500 text-4xl mb-4">✓</div>
              <h3 className="font-bold text-lg mb-2">With IMV</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                "Hey Sarah - quick question about the project timeline. Can we chat this week?"
              </p>
              <p className="text-xs text-slate-500 mt-4">
                87 words • Authentic • Sounds like you
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { num: '1', title: 'Share Your Writing', desc: 'Paste 10-20 examples of your emails, messages, or documents', time: '2 min' },
            { num: '2', title: 'We Analyze Your Style', desc: 'Our AI learns your tone, structure, and voice patterns', time: '24 hours' },
            { num: '3', title: 'Get Your IMV Prompt', desc: 'Copy your personalized prompt - works in any AI tool', time: '1 min' },
            { num: '4', title: 'Write in Your Voice', desc: 'Use forever. Refine anytime. Always sounds like you.', time: 'Forever' }
          ].map((step) => (
            <Card key={step.num} className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 mb-2">{step.desc}</p>
              <p className="text-xs text-blue-600 font-medium">{step.time}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-blue-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Sound Like Yourself?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join professionals who've stopped editing AI and started sounding authentic.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Try Free - No Credit Card Required
            </Button>
          </Link>
          <p className="text-sm text-blue-100 mt-4">
            Takes 2 minutes to set up • Use forever • Refine anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-600">
          <p>© 2026 In My Voice. Built for authentic AI writing.</p>
        </div>
      </footer>
    </div>
  )
}
