'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OnboardingPage() {
  const [text, setText] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const MINIMUM_WORDS = 500
  const RECOMMENDED_WORDS = 800

  // Calculate word count
  useEffect(() => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }, [text])

  const getProgressColor = () => {
    if (wordCount >= RECOMMENDED_WORDS) return 'bg-green-500'
    if (wordCount >= MINIMUM_WORDS) return 'bg-yellow-500'
    return 'bg-slate-300'
  }

  const getGuidanceMessage = () => {
    if (wordCount === 0) {
      return {
        type: 'info',
        text: "Get started - paste some emails, messages, or writing samples you've authored."
      }
    }
    if (wordCount < MINIMUM_WORDS) {
      return {
        type: 'info',
        text: `You're off to a great start! 🌱 We usually need a bit more to learn your voice accurately. Try adding a few more examples.`
      }
    }
    if (wordCount < RECOMMENDED_WORDS) {
      return {
        type: 'warning',
        text: `Almost there! Adding more helps us capture your authentic voice better.`
      }
    }
    return {
      type: 'success',
      text: `Perfect! ✓ We have enough to learn your voice.`
    }
  }

  const handleSave = async () => {
    if (wordCount < MINIMUM_WORDS) {
      setMessage('Please add at least 500 words to continue.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Save writing sample to database
      const { error } = await supabase
        .from('writing_samples')
        .insert({
          user_id: user.id,
          source: 'paste',
          content_text: text,
          word_count: wordCount
        })

      if (error) throw error

      // Redirect to processing page
      router.push('/app/processing')
      
    } catch (error) {
      console.error('Error saving sample:', error)
      setMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const guidance = getGuidanceMessage()
  const canContinue = wordCount >= MINIMUM_WORDS
  const progressPercent = Math.min((wordCount / RECOMMENDED_WORDS) * 100, 100)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-blue-600">IMV</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Add Your Writing
          </h2>
          <p className="text-slate-600">
            Paste 10-20 examples of emails, messages, or writing you've authored. 
            This helps us learn your authentic voice.
          </p>
        </div>

        {/* Progress Card */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-700">Word Count</p>
                <p className="text-2xl font-bold text-slate-900">{wordCount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Minimum: {MINIMUM_WORDS}</p>
                <p className="text-sm text-slate-500">Recommended: {RECOMMENDED_WORDS}</p>
              </div>
            </div>
            
            <Progress value={progressPercent} className={getProgressColor()} />
            
            <Alert className={
              guidance.type === 'success' ? 'bg-green-50 border-green-200' :
              guidance.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }>
              <AlertDescription className={
                guidance.type === 'success' ? 'text-green-800' :
                guidance.type === 'warning' ? 'text-yellow-800' :
                'text-blue-800'
              }>
                {guidance.text}
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        {/* Text Input */}
        <Card className="p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Paste Your Writing Samples
          </label>
          <Textarea
            placeholder="Paste your emails, messages, posts, or any writing you've authored here...

Examples:
- Email threads with colleagues or clients
- Slack or Teams messages
- Social media posts you wrote
- Documents or reports you authored

The more examples, the better we can learn your voice!"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={!canContinue || loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Generate My Voice →'}
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/app/dashboard')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>

        {message && (
          <Alert className="mt-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Tips */}
        <Card className="p-6 mt-8 bg-slate-50 border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-3">💡 Tips for Best Results</h3>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>✓ Include a variety of writing (formal emails, casual messages, etc.)</li>
            <li>✓ Use writing you're proud of - this is your authentic voice</li>
            <li>✓ More examples = better accuracy (aim for 800+ words)</li>
            <li>✓ Only include writing YOU authored (not replies from others)</li>
          </ul>
        </Card>
      </main>
    </div>
  )
}
