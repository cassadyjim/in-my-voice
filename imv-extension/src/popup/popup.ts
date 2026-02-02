import { getSession, getCachedPrompt, fetchActivePrompt, signOut, getUser } from '../lib/supabase'

// Website URL (use localhost for dev, vercel for production)
const WEBSITE_URL = 'https://in-my-voice.vercel.app'
// const WEBSITE_URL = 'http://localhost:3000' // Uncomment for local testing

// DOM Elements
const loadingEl = document.getElementById('loading') as HTMLDivElement
const loginSection = document.getElementById('login-section') as HTMLDivElement
const mainSection = document.getElementById('main-section') as HTMLDivElement
const loginWebsiteBtn = document.getElementById('login-website-btn') as HTMLButtonElement
const checkLoginBtn = document.getElementById('check-login-btn') as HTMLButtonElement
const loginMessage = document.getElementById('login-message') as HTMLDivElement
const userEmail = document.getElementById('user-email') as HTMLSpanElement
const promptCard = document.getElementById('prompt-card') as HTMLDivElement
const noPrompt = document.getElementById('no-prompt') as HTMLDivElement
const promptPreview = document.getElementById('prompt-preview') as HTMLDivElement
const versionBadge = document.getElementById('version-badge') as HTMLSpanElement
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement
const viewFullBtn = document.getElementById('view-full-btn') as HTMLButtonElement
const syncBtn = document.getElementById('sync-btn') as HTMLButtonElement
const lastSyncEl = document.getElementById('last-sync') as HTMLSpanElement
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement
const modal = document.getElementById('modal') as HTMLDivElement
const modalBody = document.getElementById('modal-body') as HTMLDivElement
const modalClose = document.getElementById('modal-close') as HTMLButtonElement
const modalCopy = document.getElementById('modal-copy') as HTMLButtonElement

let currentPromptText: string | null = null

// Initialize
async function init(): Promise<void> {
  try {
    // Check if user is logged in
    const { session } = await getSession()

    if (session) {
      const { user } = await getUser()
      showMainSection(user?.email || 'Unknown')
      await loadPrompt()
    } else {
      showLoginSection()
    }
  } catch (error) {
    console.error('Init error:', error)
    showLoginSection()
  }
}

function showLoginSection(): void {
  loadingEl.classList.add('hidden')
  loginSection.classList.remove('hidden')
  mainSection.classList.add('hidden')
}

function showMainSection(email: string): void {
  loadingEl.classList.add('hidden')
  loginSection.classList.add('hidden')
  mainSection.classList.remove('hidden')
  userEmail.textContent = email
}

function showMessage(text: string, type: 'success' | 'error' | 'info'): void {
  loginMessage.textContent = text
  loginMessage.className = `message message-${type}`
  loginMessage.classList.remove('hidden')
}

// Open website to login
loginWebsiteBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: WEBSITE_URL })
})

// Check login status (after user logs in on website)
checkLoginBtn.addEventListener('click', async () => {
  checkLoginBtn.disabled = true
  checkLoginBtn.textContent = 'Checking...'

  try {
    const { session } = await getSession()

    if (session) {
      const { user } = await getUser()
      showMainSection(user?.email || 'Unknown')
      await loadPrompt()
    } else {
      showMessage('Not logged in yet. Please log in on the website first, then try again.', 'info')
    }
  } catch (error) {
    showMessage('Failed to check login status. Try again.', 'error')
  } finally {
    checkLoginBtn.disabled = false
    checkLoginBtn.textContent = 'Check Login Status'
  }
})

// Load prompt
async function loadPrompt(): Promise<void> {
  // Try cache first
  const cached = await getCachedPrompt()

  if (cached.text) {
    displayPrompt(cached.text, cached.version || 1, cached.lastSync || 0)
  }

  // Fetch fresh in background
  try {
    const { prompt, error } = await fetchActivePrompt()

    if (error) {
      if (!cached.text) {
        showNoPrompt()
      }
      return
    }

    if (prompt) {
      displayPrompt(prompt.prompt_text, prompt.version_num, Date.now())
    } else {
      showNoPrompt()
    }
  } catch (error) {
    console.error('Failed to fetch prompt:', error)
  }
}

function displayPrompt(text: string, version: number, lastSync: number): void {
  currentPromptText = text
  promptCard.classList.remove('hidden')
  noPrompt.classList.add('hidden')

  // Show preview (first 200 chars)
  const preview = text.length > 200 ? text.substring(0, 200) + '...' : text
  promptPreview.textContent = preview

  versionBadge.textContent = `v${version}`

  // Update last sync
  if (lastSync) {
    const date = new Date(lastSync)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) {
      lastSyncEl.textContent = 'Just synced'
    } else if (minutes < 60) {
      lastSyncEl.textContent = `Synced ${minutes}m ago`
    } else if (hours < 24) {
      lastSyncEl.textContent = `Synced ${hours}h ago`
    } else {
      lastSyncEl.textContent = `Synced ${date.toLocaleDateString()}`
    }
  }
}

function showNoPrompt(): void {
  promptCard.classList.add('hidden')
  noPrompt.classList.remove('hidden')
}

// Copy button
copyBtn.addEventListener('click', async () => {
  if (!currentPromptText) return

  try {
    await navigator.clipboard.writeText(currentPromptText)
    copyBtn.textContent = 'Copied!'
    setTimeout(() => {
      copyBtn.textContent = 'Copy'
    }, 2000)
  } catch (error) {
    console.error('Copy failed:', error)
  }
})

// View full button
viewFullBtn.addEventListener('click', () => {
  if (!currentPromptText) return
  modalBody.textContent = currentPromptText
  modal.classList.remove('hidden')
})

// Modal close
modalClose.addEventListener('click', () => {
  modal.classList.add('hidden')
})

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden')
  }
})

// Modal copy
modalCopy.addEventListener('click', async () => {
  if (!currentPromptText) return

  try {
    await navigator.clipboard.writeText(currentPromptText)
    modalCopy.textContent = 'Copied!'
    setTimeout(() => {
      modalCopy.textContent = 'Copy to Clipboard'
    }, 2000)
  } catch (error) {
    console.error('Copy failed:', error)
  }
})

// Sync button
syncBtn.addEventListener('click', async () => {
  syncBtn.textContent = '🔄 Syncing...'
  syncBtn.disabled = true

  try {
    const { prompt, error } = await fetchActivePrompt()

    if (error) {
      console.error('Sync failed:', error)
    } else if (prompt) {
      displayPrompt(prompt.prompt_text, prompt.version_num, Date.now())

      // Notify content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'PROMPT_UPDATED' })
        }
      })
    }
  } finally {
    syncBtn.textContent = '🔄 Sync Now'
    syncBtn.disabled = false
  }
})

// Logout button
logoutBtn.addEventListener('click', async () => {
  await signOut()
  currentPromptText = null
  showLoginSection()
})

// Listen for session sync from website content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SESSION_SYNCED') {
    // Session was synced from website, refresh
    init()
    sendResponse({ success: true })
  }
  return true
})

// Start
init()
