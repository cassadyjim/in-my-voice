// Platform-specific prompt generators
// Creates optimized prompts for different AI platforms

import type { PlatformExports, PlatformName } from '@/types/chat'

interface PromptSections {
  fullPrompt: string
  coreTone: string
  vocabularySignatures: string[]
  antiPatterns: string[]
  modeACasual: string
  modeBProfessional: string
  modeCFormal: string
}

/**
 * Extract key sections from the IMV prompt text
 */
function parsePromptSections(promptText: string): PromptSections {
  const sections: PromptSections = {
    fullPrompt: promptText,
    coreTone: '',
    vocabularySignatures: [],
    antiPatterns: [],
    modeACasual: '',
    modeBProfessional: '',
    modeCFormal: '',
  }

  // Extract tone analysis
  const toneMatch = promptText.match(/\[TONE ANALYSIS\]([\s\S]*?)(?=\[|MODE|$)/i)
  if (toneMatch) {
    sections.coreTone = toneMatch[1].trim()
  }

  // Extract vocabulary signatures
  const vocabMatch = promptText.match(/\[VOCABULARY SIGNATURES\]([\s\S]*?)(?=\[|MODE|$)/i)
  if (vocabMatch) {
    sections.vocabularySignatures = vocabMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-') || line.startsWith('•'))
      .map((line) => line.replace(/^[-•]\s*/, ''))
  }

  // Extract anti-patterns (NEVER USE)
  const neverMatch = promptText.match(/\[NEVER USE\]([\s\S]*?)(?=MODE|$)/i)
  if (neverMatch) {
    sections.antiPatterns = neverMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-') || line.startsWith('•'))
      .map((line) => line.replace(/^[-•]\s*/, ''))
  }

  // Extract modes
  const modeAMatch = promptText.match(/MODE A[^:]*:([\s\S]*?)(?=MODE B|$)/i)
  if (modeAMatch) {
    sections.modeACasual = modeAMatch[1].trim()
  }

  const modeBMatch = promptText.match(/MODE B[^:]*:([\s\S]*?)(?=MODE C|$)/i)
  if (modeBMatch) {
    sections.modeBProfessional = modeBMatch[1].trim()
  }

  const modeCMatch = promptText.match(/MODE C[^:]*:([\s\S]*?)(?=REMEMBER|$)/i)
  if (modeCMatch) {
    sections.modeCFormal = modeCMatch[1].trim()
  }

  return sections
}

/**
 * Generate ChatGPT-optimized prompt
 * ChatGPT works well with conversational system prompts
 */
function generateChatGPT(sections: PromptSections): string {
  return `You are a writing assistant that mimics my personal writing voice. Here is my voice profile:

## My Writing Voice

${sections.coreTone}

## Signature Phrases & Vocabulary
${sections.vocabularySignatures.map((v) => `- ${v}`).join('\n')}

## Words/Phrases to AVOID
${sections.antiPatterns.map((a) => `- ${a}`).join('\n')}

## Writing Modes

**Casual/Internal:** ${sections.modeACasual.substring(0, 200)}...

**Professional/External:** ${sections.modeBProfessional.substring(0, 200)}...

**Formal/Executive:** ${sections.modeCFormal.substring(0, 200)}...

---

When I ask you to write something, always use my voice profile above. Match my tone, use my signature phrases naturally, and never use the words/phrases I've flagged to avoid. Ask me which mode (casual, professional, or formal) if it's not clear from context.`
}

/**
 * Generate Claude-optimized prompt
 * Claude responds well to XML-structured prompts
 */
function generateClaude(sections: PromptSections): string {
  return `<voice_profile>
<description>
${sections.coreTone}
</description>

<vocabulary>
${sections.vocabularySignatures.map((v) => `<phrase>${v}</phrase>`).join('\n')}
</vocabulary>

<banned_phrases>
${sections.antiPatterns.map((a) => `<avoid>${a}</avoid>`).join('\n')}
</banned_phrases>

<modes>
<casual>${sections.modeACasual.substring(0, 300)}</casual>
<professional>${sections.modeBProfessional.substring(0, 300)}</professional>
<formal>${sections.modeCFormal.substring(0, 300)}</formal>
</modes>
</voice_profile>

Please write all responses using my voice profile above. Match my tone and vocabulary. Never use phrases from the banned list. If the formality level isn't clear, ask which mode I prefer.`
}

/**
 * Generate Copilot-optimized prompt
 * Copilot works best with concise, bullet-point instructions
 */
function generateCopilot(sections: PromptSections): string {
  // Extract just the key descriptors from tone
  const toneKeywords = sections.coreTone
    .split(/[.,;]/)
    .slice(0, 3)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ')

  return `# My Writing Voice Profile

**Tone:** ${toneKeywords}

**Use these phrases:** ${sections.vocabularySignatures.slice(0, 5).join(' | ')}

**Never use:** ${sections.antiPatterns.slice(0, 5).join(' | ')}

**Modes:**
- Casual: Relaxed, contractions OK
- Professional: Clear and direct
- Formal: Structured, polished

Write in my voice. Ask for mode if unclear.`
}

/**
 * Generate Gemini-optimized prompt
 * Gemini handles detailed instructions well
 */
function generateGemini(sections: PromptSections): string {
  return `I want you to write in my personal voice. Here's my detailed voice profile:

**Core Tone & Style:**
${sections.coreTone}

**My Signature Vocabulary:**
${sections.vocabularySignatures.slice(0, 8).map((v) => `• ${v}`).join('\n')}

**Phrases I Never Use (banned list):**
${sections.antiPatterns.slice(0, 8).map((a) => `• ${a}`).join('\n')}

**Writing Modes:**

1. **Casual Mode** (for internal comms, friends, Slack):
${sections.modeACasual.substring(0, 250)}

2. **Professional Mode** (for clients, external emails):
${sections.modeBProfessional.substring(0, 250)}

3. **Formal Mode** (for executives, official documents):
${sections.modeCFormal.substring(0, 250)}

---

Instructions: Always write in my voice using the profile above. Incorporate my vocabulary naturally. Avoid all banned phrases. Default to Professional mode unless I specify otherwise.`
}

/**
 * Generate generic/universal prompt
 * Works across any LLM
 */
function generateGeneric(sections: PromptSections): string {
  return `VOICE PROFILE INSTRUCTIONS

You are helping me write content in my personal voice. Follow these guidelines:

TONE: ${sections.coreTone.substring(0, 300)}

VOCABULARY TO USE:
${sections.vocabularySignatures.slice(0, 6).map((v) => `- ${v}`).join('\n')}

PHRASES TO AVOID:
${sections.antiPatterns.slice(0, 6).map((a) => `- ${a}`).join('\n')}

FORMALITY LEVELS:
- Casual: Relaxed, conversational, contractions allowed
- Professional: Clear, direct, business-appropriate
- Formal: Polished, structured, executive-level

Always write in my voice. Ask for clarification on formality level if needed.`
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
