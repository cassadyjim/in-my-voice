// Content script for ChatGPT injection

let promptText: string | null = null
let isInjected = false

// Fetch prompt from background
async function loadPrompt(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PROMPT' })
    if (response?.success && response.data?.text) {
      promptText = response.data.text
      console.log('IMV: Prompt loaded (v' + response.data.version + ')')
    }
  } catch (error) {
    console.error('IMV: Failed to load prompt', error)
  }
}

// Find ChatGPT's message input
function findTextarea(): HTMLTextAreaElement | HTMLDivElement | null {
  // ChatGPT uses different selectors over time
  const selectors = [
    '#prompt-textarea', // Current main selector
    'textarea[data-id="root"]',
    'textarea[placeholder*="Message"]',
    'div[contenteditable="true"][data-placeholder]',
    '.ProseMirror',
  ]

  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element) return element as HTMLTextAreaElement | HTMLDivElement
  }

  return null
}

// Create and inject the IMV button
function injectButton(): void {
  if (document.querySelector('.imv-inject-btn')) return // Already injected

  const textarea = findTextarea()
  if (!textarea) return

  // Find the parent container of the textarea
  const container = textarea.closest('form') || textarea.parentElement?.parentElement

  if (!container) return

  // Create button
  const button = document.createElement('button')
  button.className = 'imv-inject-btn'
  button.innerHTML = `
    <span class="imv-icon">🎤</span>
    <span class="imv-text">Add IMV</span>
  `
  button.title = 'Insert your In My Voice prompt'

  button.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    injectPromptIntoTextarea()
  })

  // Try to insert near the send button or at the top of the form
  const sendButton = container.querySelector('button[data-testid="send-button"]') ||
                     container.querySelector('button[aria-label*="Send"]') ||
                     container.querySelector('button:last-of-type')

  if (sendButton && sendButton.parentElement) {
    sendButton.parentElement.insertBefore(button, sendButton)
  } else {
    // Fallback: add as floating button
    button.classList.add('imv-floating')
    document.body.appendChild(button)
  }

  isInjected = true
  console.log('IMV: Button injected')
}

// Insert prompt text into the textarea
function injectPromptIntoTextarea(): void {
  if (!promptText) {
    showNotification('No IMV prompt found. Please sync in the extension popup.', 'error')
    return
  }

  const textarea = findTextarea()
  if (!textarea) {
    showNotification('Could not find ChatGPT input. Please refresh the page.', 'error')
    return
  }

  // Format the prompt for injection
  const formattedPrompt = `${promptText}

---

Now, please respond to my next message using the voice profile above. Here's my request:

`

  // Handle both textarea and contenteditable div
  if (textarea instanceof HTMLTextAreaElement) {
    const currentValue = textarea.value
    textarea.value = formattedPrompt + currentValue
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  } else {
    // ContentEditable div (ProseMirror)
    const currentHTML = textarea.innerHTML
    textarea.innerHTML = formattedPrompt.replace(/\n/g, '<br>') + currentHTML
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Focus the textarea
  textarea.focus()

  // Show success notification
  showNotification('IMV prompt added! Type your message below the line.', 'success')

  // Update button to show it's been used
  const button = document.querySelector('.imv-inject-btn')
  if (button) {
    button.classList.add('imv-used')
    const textSpan = button.querySelector('.imv-text')
    if (textSpan) textSpan.textContent = 'Added ✓'
  }
}

// Show notification toast
function showNotification(message: string, type: 'success' | 'error'): void {
  // Remove existing notifications
  document.querySelectorAll('.imv-notification').forEach((el) => el.remove())

  const notification = document.createElement('div')
  notification.className = `imv-notification imv-notification-${type}`
  notification.textContent = message

  document.body.appendChild(notification)

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('imv-notification-hide')
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

// Watch for DOM changes (ChatGPT dynamically loads content)
function observeDOM(): void {
  const observer = new MutationObserver(() => {
    const textarea = findTextarea()
    if (textarea && !document.querySelector('.imv-inject-btn')) {
      injectButton()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// Listen for messages from popup (e.g., prompt updated)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PROMPT_UPDATED') {
    loadPrompt().then(() => {
      sendResponse({ success: true })
    })
    return true
  }
  if (message.type === 'INJECT_NOW') {
    injectPromptIntoTextarea()
    sendResponse({ success: true })
    return true
  }
})

// Initialize
async function init(): Promise<void> {
  console.log('IMV: Content script loaded')
  await loadPrompt()
  observeDOM()

  // Try to inject button immediately
  setTimeout(() => {
    injectButton()
  }, 1000)
}

init()
