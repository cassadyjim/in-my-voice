// Callback page script - processes magic link tokens from URL

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jpfillyapcxylcogirxq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Klh-O3DcomOCiL5D2qd62A_k1s3VC43'

// Chrome storage adapter
const chromeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    const result = await chrome.storage.local.get(key)
    return result[key] || null
  },
  async setItem(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value })
  },
  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key)
  },
}

function showSuccess() {
  document.getElementById('loading')?.classList.add('hidden')
  document.getElementById('success')?.classList.remove('hidden')
}

function showError(message: string) {
  document.getElementById('loading')?.classList.add('hidden')
  document.getElementById('error')?.classList.remove('hidden')
  const errorMessage = document.getElementById('error-message')
  if (errorMessage) errorMessage.textContent = message
}

async function handleCallback() {
  try {
    // Get the hash fragment from URL (Supabase puts tokens there)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const errorDescription = hashParams.get('error_description')

    if (errorDescription) {
      showError(errorDescription)
      return
    }

    if (!accessToken) {
      // Maybe it's using PKCE flow with code in query params
      const queryParams = new URLSearchParams(window.location.search)
      const code = queryParams.get('code')

      if (code) {
        // Exchange code for session using PKCE
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            storage: chromeStorageAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        })

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          showError(error.message)
          return
        }

        if (data.session) {
          showSuccess()
          // Auto-close after 2 seconds
          setTimeout(() => window.close(), 2000)
          return
        }
      }

      showError('No authentication tokens found in URL')
      return
    }

    // Create Supabase client with Chrome storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: chromeStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })

    // Set the session manually from the tokens
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    })

    if (error) {
      showError(error.message)
      return
    }

    if (data.session) {
      showSuccess()
      // Auto-close after 2 seconds
      setTimeout(() => window.close(), 2000)
    } else {
      showError('Failed to establish session')
    }
  } catch (err) {
    showError((err as Error).message)
  }
}

// Run on page load
handleCallback()
