// Background service worker - NO Supabase imports (service workers have API limitations)
// All Supabase operations happen in popup.ts, which caches data to chrome.storage

// Message types for communication
export type MessageType =
  | { type: 'GET_PROMPT' }
  | { type: 'CHECK_AUTH' }

export type MessageResponse =
  | { success: true; data: unknown }
  | { success: false; error: string }

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse)
  return true // Keep channel open for async response
})

async function handleMessage(message: MessageType): Promise<MessageResponse> {
  try {
    switch (message.type) {
      case 'GET_PROMPT': {
        // Read from chrome.storage (populated by popup)
        const result = await chrome.storage.local.get(['cachedPrompt', 'promptVersion', 'lastSync'])

        if (result.cachedPrompt) {
          return {
            success: true,
            data: {
              text: result.cachedPrompt,
              version: result.promptVersion || 1,
              lastSync: result.lastSync,
            },
          }
        }

        return { success: false, error: 'No prompt cached. Please open the extension popup to sync.' }
      }

      case 'CHECK_AUTH': {
        // Check if we have a session stored
        const result = await chrome.storage.local.get(['sb-jpfillyapcxylcogirxq-auth-token'])
        const hasSession = !!result['sb-jpfillyapcxylcogirxq-auth-token']

        return {
          success: true,
          data: { isLoggedIn: hasSession },
        }
      }

      default:
        return { success: false, error: 'Unknown message type' }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// On install, log a message
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('IMV Extension installed! Click the extension icon to log in.')
  }
})

// Listen for storage changes to notify content scripts
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.cachedPrompt) {
    // Notify all tabs that prompt was updated
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && tab.url?.includes('chat.openai.com')) {
          chrome.tabs.sendMessage(tab.id, { type: 'PROMPT_UPDATED' }).catch(() => {
            // Tab might not have content script loaded, ignore
          })
        }
      })
    })
  }
})
