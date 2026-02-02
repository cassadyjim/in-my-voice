import { createClient, SupabaseClient } from '@supabase/supabase-js'

// These match your IMV app's Supabase credentials (public anon key is safe to include)
const SUPABASE_URL = 'https://jpfillyapcxylcogirxq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwZmlsbHlhcGN4eWxjb2dpcnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MDg4MTcsImV4cCI6MjA1Mjk4NDgxN30.AAPymFbSaWMV7yT_fVV_HbKpFJsKmQN9e_tZ2ItWj98'

// Website URL for redirects
const WEBSITE_URL = 'https://inmyvoice.app'

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

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: chromeStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  return supabaseClient
}

export async function signInWithEmail(email: string): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient()

  // Get the extension's callback URL
  const callbackUrl = chrome.runtime.getURL('callback.html')

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl,
    },
  })

  return { error: error as Error | null }
}

export async function getSession() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export async function getUser() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  return { user: data.user, error }
}

export async function signOut() {
  const supabase = getSupabaseClient()
  await supabase.auth.signOut()
  // Clear cached prompt
  await chrome.storage.local.remove(['cachedPrompt', 'promptVersion', 'lastSync'])
}

export interface PromptVersion {
  id: number
  user_id: string
  version_num: number
  prompt_text: string
  is_active: boolean
  created_at: string
}

export async function fetchActivePrompt(): Promise<{ prompt: PromptVersion | null; error: Error | null }> {
  const supabase = getSupabaseClient()
  const { user, error: userError } = await getUser()

  if (userError || !user) {
    return { prompt: null, error: userError || new Error('Not logged in') }
  }

  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (error) {
    return { prompt: null, error: error as unknown as Error }
  }

  // Cache the prompt locally
  if (data) {
    await chrome.storage.local.set({
      cachedPrompt: data.prompt_text,
      promptVersion: data.version_num,
      lastSync: Date.now(),
    })
  }

  return { prompt: data as PromptVersion, error: null }
}

export async function getCachedPrompt(): Promise<{ text: string | null; version: number | null; lastSync: number | null }> {
  const result = await chrome.storage.local.get(['cachedPrompt', 'promptVersion', 'lastSync'])
  return {
    text: result.cachedPrompt || null,
    version: result.promptVersion || null,
    lastSync: result.lastSync || null,
  }
}

// Set session from tokens (used by callback page)
export async function setSessionFromTokens(accessToken: string, refreshToken: string) {
  const supabase = getSupabaseClient()
  return supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
}
