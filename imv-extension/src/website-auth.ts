// Content script that runs on the IMV website to capture auth session
// This enables seamless login: user logs in on website, extension captures the session

const STORAGE_KEY = 'sb-jpfillyapcxylcogirxq-auth-token'

interface SupabaseSession {
  access_token: string
  refresh_token: string
  expires_at?: number
  user?: {
    id: string
    email?: string
  }
}

// Check if there's a valid session in localStorage
function getWebsiteSession(): SupabaseSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    return parsed as SupabaseSession
  } catch {
    return null
  }
}

// Send session to extension background
async function syncSessionToExtension(session: SupabaseSession) {
  try {
    // Store the session in the same format the extension expects
    await chrome.storage.local.set({
      [STORAGE_KEY]: JSON.stringify(session),
    })

    console.log('IMV: Session synced to extension')

    // Notify the popup if it's open
    chrome.runtime.sendMessage({ type: 'SESSION_SYNCED', email: session.user?.email })
  } catch (error) {
    console.error('IMV: Failed to sync session', error)
  }
}

// Show a subtle notification that the extension detected login
function showSyncNotification() {
  const notification = document.createElement('div')
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">🎤</span>
        <div>
          <div style="font-weight: 600;">IMV Extension Connected!</div>
          <div style="opacity: 0.9; font-size: 12px; margin-top: 2px;">Your voice profile is now synced</div>
        </div>
      </div>
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `
  document.body.appendChild(notification)

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.transition = 'opacity 0.3s'
    notification.style.opacity = '0'
    setTimeout(() => notification.remove(), 300)
  }, 4000)
}

// Main function
async function initWebsiteAuth() {
  // Wait a bit for Supabase to initialize the session
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const session = getWebsiteSession()

  if (session?.access_token) {
    // Check if extension already has this session
    const stored = await chrome.storage.local.get([STORAGE_KEY])
    const existingSession = stored[STORAGE_KEY]
      ? JSON.parse(stored[STORAGE_KEY])
      : null

    // Only sync if session is different or doesn't exist
    if (!existingSession || existingSession.access_token !== session.access_token) {
      await syncSessionToExtension(session)
      showSyncNotification()
    }
  }
}

// Run on page load
initWebsiteAuth()

// Also listen for storage changes (in case user logs in after page load)
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY && event.newValue) {
    try {
      const session = JSON.parse(event.newValue) as SupabaseSession
      if (session.access_token) {
        syncSessionToExtension(session)
        showSyncNotification()
      }
    } catch {
      // Ignore parse errors
    }
  }
})
