'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'

export default function ProcessingPage() {
  const [status, setStatus] = useState('Analyzing your writing...')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    generatePrompt()
  }, [])

  async function generatePrompt() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setStatus('Loading your writing samples...')

      // Get user's writing samples
      const { data: samples, error: samplesError } = await supabase
        .from('writing_samples')
        .select('content_text, word_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (samplesError) throw samplesError
      if (!samples || samples.length === 0) {
        throw new Error('No writing samples found')
      }

      setStatus('Analyzing your voice patterns...')

      // Call API to generate prompt
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          samples: samples.map(s => s.content_text),
          totalWords: samples.reduce((sum, s) => sum + s.word_count, 0)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate prompt')
      }

      const { prompt } = await response.json()

      setStatus('Saving your IMV prompt...')

      // Get the next version number
      const { data: existingVersions } = await supabase
        .from('prompt_versions')
        .select('version_num')
        .eq('user_id', user.id)
        .order('version_num', { ascending: false })
        .limit(1)

      const nextVersion = existingVersions && existingVersions.length > 0 
        ? existingVersions[0].version_num + 1 
        : 1

      // Deactivate all previous versions
      await supabase
        .from('prompt_versions')
        .update({ is_active: false })
        .eq('user_id', user.id)

      // Save new prompt version
      const { error: promptError } = await supabase
        .from('prompt_versions')
        .insert({
          user_id: user.id,
          version_num: nextVersion,
          prompt_text: prompt,
          is_active: true,
          generation_params: { model: 'gpt-4o', temperature: 0.7 }
        })

      if (promptError) throw promptError

      setStatus('Complete! Redirecting...')

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/app/dashboard')
      }, 1000)

    } catch (err: any) {
      console.error('Error generating prompt:', err)
      setError(err.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center space-y-6">
          {!error ? (
            <>
              <div className="w-16 h-16 mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Generating Your Voice
                </h2>
                <p className="text-slate-600">
                  {status}
                </p>
              </div>

              <div className="text-sm text-slate-500">
                This usually takes 30-60 seconds...
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">❌</span>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Something Went Wrong
                </h2>
                <p className="text-slate-600">
                  {error}
                </p>
              </div>

              <button
                onClick={() => router.push('/app/dashboard')}
                className="text-blue-600 hover:underline"
              >
                Return to Dashboard
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
