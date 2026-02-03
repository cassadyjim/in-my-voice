// Platform-specific prompt generators
// Creates optimized prompts for different AI platforms

import type { PlatformExports, PlatformName } from '@/types/chat'

interface PromptSections {
  fullPrompt: string
  voiceIdentity: string
  coreVoice: string
  signaturePatterns: string[]
  avoidancePatterns: string[]
  casualMode: string
  professionalMode: string
  formalMode: string
}

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
 * Extract key sections from the new IMV prompt structure
 */
function parsePromptSections(promptText: string): PromptSections {
  const sections: PromptSections = {
    fullPrompt: promptText,
    voiceIdentity: '',
    coreVoice: '',
    signaturePatterns: [],
    avoidancePatterns: [],
    casualMode: '',
    professionalMode: '',
    formalMode: '',
  }

  // Extract Voice Identity section
  const identityMatch = promptText.match(/## 1\. VOICE IDENTITY[^\n]*\n([\s\S]*?)(?=## 2|$)/i)
  if (identityMatch) {
    sections.voiceIdentity = identityMatch[1].trim().substring(0, 500)
  }

  // Extract Core Voice Foundation
  const coreMatch = promptText.match(/## 2\. CORE VOICE FOUNDATION[^\n]*\n([\s\S]*?)(?=## 3|$)/i)
  if (coreMatch) {
    sections.coreVoice = coreMatch[1].trim().substring(0, 500)
  }

  // Extract Signature Patterns (Commonly Used Language)
  const signatureMatch = promptText.match(/### A\. Commonly Used Language[^\n]*\n([\s\S]*?)(?=### B|## 4|$)/i)
  if (signatureMatch) {
    sections.signaturePatterns = signatureMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-') || line.startsWith('•') || line.startsWith('"'))
      .map((line) => line.replace(/^[-•]\s*/, '').replace(/^"/, '').replace(/"$/, ''))
      .filter((line) => line.length > 0)
      .slice(0, 10)
  }

  // Extract Avoidance Patterns (Rarely or Never Used)
  const avoidMatch = promptText.match(/### B\. Rarely or Never Used[^\n]*\n([\s\S]*?)(?=### C|## 4|$)/i)
  if (avoidMatch) {
    sections.avoidancePatterns = avoidMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-') || line.startsWith('•'))
      .map((line) => line.replace(/^[-•]\s*/, ''))
      .filter((line) => line.length > 0)
      .slice(0, 10)
  }

  // Extract Casual Mode
  const casualMatch = promptText.match(/### CASUAL[^\n]*\n([\s\S]*?)(?=### PROFESSIONAL|## 6|$)/i)
  if (casualMatch) {
    sections.casualMode = casualMatch[1].trim().substring(0, 400)
  }

  // Extract Professional Mode
  const professionalMatch = promptText.match(/### PROFESSIONAL[^\n]*\n([\s\S]*?)(?=### FORMAL|## 6|$)/i)
  if (professionalMatch) {
    sections.professionalMode = professionalMatch[1].trim().substring(0, 400)
  }

  // Extract Formal Mode
  const formalMatch = promptText.match(/### FORMAL[^\n]*\n([\s\S]*?)(?=## 6|## 7|$)/i)
  if (formalMatch) {
    sections.formalMode = formalMatch[1].trim().substring(0, 400)
  }

  return sections
}

/**
 * Generate ChatGPT-optimized prompt
 * ChatGPT works well with conversational system prompts
 */
function generateChatGPT(sections: PromptSections): string {
  // If sections are empty, return the full prompt with a wrapper
  if (!sections.coreVoice && !sections.voiceIdentity) {
    return `You are a writing assistant that mimics my personal writing voice. Here is my complete voice profile:

${sections.fullPrompt}

${IMV_WORKFLOW_INSTRUCTIONS}`
  }

  return `You are a writing assistant that mimics my personal writing voice. Here is my voice profile:

## My Writing Voice

${sections.voiceIdentity || sections.coreVoice}

## Signature Phrases & Vocabulary
${sections.signaturePatterns.length > 0 ? sections.signaturePatterns.map((v) => `- ${v}`).join('\n') : '- Use natural, authentic language from my profile'}

## Phrases to AVOID
${sections.avoidancePatterns.length > 0 ? sections.avoidancePatterns.map((a) => `- ${a}`).join('\n') : '- Avoid generic AI-sounding phrases'}

## Writing Modes

**A) Casual/Internal:** ${sections.casualMode || 'Relaxed, friendly, contractions allowed'}

**B) Professional/External:** ${sections.professionalMode || 'Clear, direct, business-appropriate'}

**C) Formal/Executive:** ${sections.formalMode || 'Polished, structured, formal'}

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate Claude-optimized prompt
 * Claude responds well to XML-structured prompts
 */
function generateClaude(sections: PromptSections): string {
  // If sections are empty, return the full prompt with XML wrapper
  if (!sections.coreVoice && !sections.voiceIdentity) {
    return `<voice_profile>
${sections.fullPrompt}
</voice_profile>

${IMV_WORKFLOW_INSTRUCTIONS}`
  }

  return `<voice_profile>
<description>
${sections.voiceIdentity || sections.coreVoice}
</description>

<signature_phrases>
${sections.signaturePatterns.length > 0 ? sections.signaturePatterns.map((v) => `<phrase>${v}</phrase>`).join('\n') : '<phrase>Use natural, authentic language</phrase>'}
</signature_phrases>

<avoidance_patterns>
${sections.avoidancePatterns.length > 0 ? sections.avoidancePatterns.map((a) => `<avoid>${a}</avoid>`).join('\n') : '<avoid>Generic AI-sounding phrases</avoid>'}
</avoidance_patterns>

<modes>
<casual label="A">${sections.casualMode || 'Relaxed, friendly tone'}</casual>
<professional label="B">${sections.professionalMode || 'Clear, direct, business tone'}</professional>
<formal label="C">${sections.formalMode || 'Polished, structured, formal tone'}</formal>
</modes>
</voice_profile>

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate Copilot-optimized prompt
 * Copilot works best with concise, bullet-point instructions
 */
function generateCopilot(sections: PromptSections): string {
  // Extract key descriptors from voice identity
  const voiceSummary = (sections.voiceIdentity || sections.coreVoice || 'Direct, authentic, personal')
    .split(/[.,;]/)
    .slice(0, 3)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ')
    .substring(0, 150)

  return `# My Writing Voice Profile

**Tone:** ${voiceSummary}

**Use these phrases:** ${sections.signaturePatterns.slice(0, 5).join(' | ') || 'Natural, authentic language'}

**Never use:** ${sections.avoidancePatterns.slice(0, 5).join(' | ') || 'Generic AI phrases'}

**Modes:**
- A) Casual: Relaxed, contractions OK
- B) Professional: Clear and direct
- C) Formal: Structured, polished

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate Gemini-optimized prompt
 * Gemini handles detailed instructions well
 */
function generateGemini(sections: PromptSections): string {
  // If sections are empty, return the full prompt
  if (!sections.coreVoice && !sections.voiceIdentity) {
    return `I want you to write in my personal voice. Here's my detailed voice profile:

${sections.fullPrompt}

${IMV_WORKFLOW_INSTRUCTIONS}`
  }

  return `I want you to write in my personal voice. Here's my detailed voice profile:

**Core Voice & Style:**
${sections.voiceIdentity || sections.coreVoice}

**My Signature Vocabulary:**
${sections.signaturePatterns.length > 0 ? sections.signaturePatterns.slice(0, 8).map((v) => `• ${v}`).join('\n') : '• Use natural, authentic language'}

**Phrases to Avoid:**
${sections.avoidancePatterns.length > 0 ? sections.avoidancePatterns.slice(0, 8).map((a) => `• ${a}`).join('\n') : '• Generic AI-sounding phrases'}

**Writing Modes:**

A) **Casual Mode** (for internal comms, friends, Slack):
${sections.casualMode || 'Relaxed, friendly, contractions allowed'}

B) **Professional Mode** (for clients, external emails):
${sections.professionalMode || 'Clear, direct, business-appropriate'}

C) **Formal Mode** (for executives, official documents):
${sections.formalMode || 'Polished, structured, formal'}

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate generic/universal prompt
 * Works across any LLM
 */
function generateGeneric(sections: PromptSections): string {
  // If sections are empty, return the full prompt
  if (!sections.coreVoice && !sections.voiceIdentity) {
    return `VOICE PROFILE INSTRUCTIONS

You are helping me write content in my personal voice. Here is my complete voice profile:

${sections.fullPrompt}

${IMV_WORKFLOW_INSTRUCTIONS}`
  }

  return `VOICE PROFILE INSTRUCTIONS

You are helping me write content in my personal voice. Follow these guidelines:

VOICE DESCRIPTION:
${(sections.voiceIdentity || sections.coreVoice).substring(0, 400)}

VOCABULARY TO USE:
${sections.signaturePatterns.length > 0 ? sections.signaturePatterns.slice(0, 6).map((v) => `- ${v}`).join('\n') : '- Use natural, authentic language'}

PHRASES TO AVOID:
${sections.avoidancePatterns.length > 0 ? sections.avoidancePatterns.slice(0, 6).map((a) => `- ${a}`).join('\n') : '- Generic AI-sounding phrases'}

FORMALITY LEVELS:
- A) Casual: Relaxed, conversational, contractions allowed
- B) Professional: Clear, direct, business-appropriate
- C) Formal: Polished, structured, executive-level

${IMV_WORKFLOW_INSTRUCTIONS}`
}

/**
 * Generate all platform-specific prompts
 */
export function generatePlatformExports(promptText: string): PlatformExports {
  const sections = parsePromptSections(promptText)

  return {
    chatgpt: generateChatGPT(sections),
    claude: generateClaude(sections),
    copilot: generateCopilot(sections),
    gemini: generateGemini(sections),
    generic: generateGeneric(sections),
  }
}

/**
 * Generate a single platform-specific prompt
 */
export function generateForPlatform(
  promptText: string,
  platform: PlatformName
): string {
  const sections = parsePromptSections(promptText)

  switch (platform) {
    case 'chatgpt':
      return generateChatGPT(sections)
    case 'claude':
      return generateClaude(sections)
    case 'copilot':
      return generateCopilot(sections)
    case 'gemini':
      return generateGemini(sections)
    case 'generic':
    default:
      return generateGeneric(sections)
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
