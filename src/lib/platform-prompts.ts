// Platform-specific prompt generators
// Creates optimized prompts for different AI platforms

import type { PlatformExports, PlatformName } from '@/types/chat'

/**
 * IMV Workflow Instructions - added to all platform exports
 */
const IMV_WORKFLOW_INSTRUCTIONS = `
===========================================
INSTRUCTIONS FOR AI ASSISTANT:
===========================================

When the user includes "IMV" in their request, follow this workflow:

STEP 1: DETECT IMV TRIGGER
- Look for "IMV" anywhere in the user's message
- Examples: "write me an email IMV", "draft this IMV", "respond to this IMV"

STEP 2: PROMPT FOR MODE SELECTION
Respond with:
"I'll write that in your voice. What's the context?
A) Casual/Internal - Team messages, quick updates, Slack
B) Professional/External - Clients, vendors, business partners
C) Formal/Executive - Board, legal, official correspondence
Just reply with A, B, or C."

STEP 3: WAIT FOR USER RESPONSE
- User will respond with A, B, or C
- Or user might say "casual", "professional", "formal"
- Or user might describe context: "this is for my team" → use A

STEP 4: GENERATE CONTENT IN SELECTED MODE
Use the appropriate voice profile section based on their selection.

STEP 5: OFFER MODIFICATION OPTIONS
After delivering the generated content, ALWAYS show these options:

"Want me to adjust this? Pick a number:
1. 📉 Shorter
2. 📈 Longer
3. 😊 More Casual
4. 👔 More Professional
5. 🎯 More like me
6. 💡 Clearer
7. 👥 Different Audience
8. 🔄 Complete Rewrite"

If user selects an option, regenerate the content with that modification applied while maintaining the voice profile.
`

/**
 * Generate ChatGPT-optimized prompt
 * ChatGPT works well with conversational system prompts
 */
function generateChatGPT(fullPrompt: string): string {
  return `You are a writing assistant that mimics my personal writing voice.

===========================================
MY COMPLETE VOICE PROFILE:
===========================================

${fullPrompt}

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate Claude-optimized prompt
 * Claude responds well to XML-structured prompts
 */
function generateClaude(fullPrompt: string): string {
  return `<voice_profile>
<complete_profile>
${fullPrompt}
</complete_profile>
</voice_profile>

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate Copilot-optimized prompt
 * Copilot works best with clear markdown structure
 */
function generateCopilot(fullPrompt: string): string {
  return `# My Writing Voice Profile

You are a writing assistant that mimics my personal writing voice. Follow this complete profile:

---

${fullPrompt}

---

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate Gemini-optimized prompt
 * Gemini handles detailed instructions well
 */
function generateGemini(fullPrompt: string): string {
  return `I want you to write in my personal voice. Here's my complete voice profile:

===========================================
MY VOICE PROFILE
===========================================

${fullPrompt}

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate generic/universal prompt
 * Works across any LLM
 */
function generateGeneric(fullPrompt: string): string {
  return `VOICE PROFILE INSTRUCTIONS

You are helping me write content in my personal voice. Follow this complete voice profile:

===========================================
MY COMPLETE VOICE PROFILE
===========================================

${fullPrompt}

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate all platform-specific prompts
 */
export function generatePlatformExports(promptText: string): PlatformExports {
  return {
    chatgpt: generateChatGPT(promptText),
    claude: generateClaude(promptText),
    copilot: generateCopilot(promptText),
    gemini: generateGemini(promptText),
    generic: generateGeneric(promptText),
  }
}

/**
 * Generate a single platform-specific prompt
 */
export function generateForPlatform(
  promptText: string,
  platform: PlatformName
): string {
  switch (platform) {
    case 'chatgpt':
      return generateChatGPT(promptText)
    case 'claude':
      return generateClaude(promptText)
    case 'copilot':
      return generateCopilot(promptText)
    case 'gemini':
      return generateGemini(promptText)
    case 'generic':
    default:
      return generateGeneric(promptText)
  }
}

/**
 * Platform display metadata
 */
export const PLATFORM_INFO: Record<
  PlatformName,
  { name: string; icon: string; description: string }
> = {
  chatgpt: {
    name: 'ChatGPT',
    icon: '🤖',
    description: 'Optimized for OpenAI ChatGPT',
  },
  claude: {
    name: 'Claude',
    icon: '🧠',
    description: 'XML-structured for Anthropic Claude',
  },
  copilot: {
    name: 'Copilot',
    icon: '✈️',
    description: 'Concise format for Microsoft Copilot',
  },
  gemini: {
    name: 'Gemini',
    icon: '✨',
    description: 'Detailed format for Google Gemini',
  },
  generic: {
    name: 'Universal',
    icon: '📋',
    description: 'Works with any AI assistant',
  },
}
