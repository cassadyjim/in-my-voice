/**
 * Parses an IMV prompt into structured sections for display
 */

export interface ParsedPrompt {
  userName: string
  coreVoice: {
    toneAnalysis: string
    vocabularySignatures: string
    antiPatterns: string
  }
  modes: {
    casual: {
      structure: string
      openings: string
      closings: string
      example: string
    }
    professional: {
      structure: string
      openings: string
      closings: string
      example: string
    }
    formal: {
      structure: string
      openings: string
      closings: string
      example: string
    }
  }
  rawText: string
}

/**
 * Extract content between two section headers
 */
function extractSection(text: string, startMarker: string, endMarker?: string): string {
  const startRegex = new RegExp(`${escapeRegex(startMarker)}[\\s\\S]*?\\n`, 'i')
  const startMatch = text.match(startRegex)

  if (!startMatch) return ''

  const startIndex = text.indexOf(startMatch[0]) + startMatch[0].length

  if (endMarker) {
    const endRegex = new RegExp(`\\n[=\\-]+\\s*\\n.*?${escapeRegex(endMarker)}`, 'i')
    const endMatch = text.slice(startIndex).match(endRegex)
    if (endMatch) {
      return text.slice(startIndex, startIndex + text.slice(startIndex).indexOf(endMatch[0])).trim()
    }
  }

  // Find next major section (line of = or -)
  const nextSection = text.slice(startIndex).match(/\n={3,}\s*\n/i)
  if (nextSection) {
    return text.slice(startIndex, startIndex + text.slice(startIndex).indexOf(nextSection[0])).trim()
  }

  return text.slice(startIndex).trim()
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extract a specific field from a section
 */
function extractField(sectionText: string, fieldName: string): string {
  const regex = new RegExp(`${escapeRegex(fieldName)}:?\\s*\\n?([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i')
  const match = sectionText.match(regex)
  return match ? match[1].trim() : ''
}

/**
 * Parse the full IMV prompt text into structured data
 */
export function parsePrompt(promptText: string): ParsedPrompt {
  // Extract user name from header
  const nameMatch = promptText.match(/IMV STYLE PROFILE\s*-\s*(.+?)(?:\n|$)/i)
  const userName = nameMatch ? nameMatch[1].trim() : 'User'

  // Extract core voice foundation
  const coreSection = extractSection(promptText, 'CORE VOICE FOUNDATION', 'MODE A')
  const toneAnalysis = extractField(coreSection, '[TONE ANALYSIS]') ||
                       extractField(coreSection, 'TONE ANALYSIS') ||
                       extractBracketedContent(coreSection, 'TONE ANALYSIS')

  const vocabularySignatures = extractField(coreSection, 'VOCABULARY SIGNATURES') ||
                               extractField(coreSection, '[SIGNATURE PHRASES]') ||
                               extractBracketedContent(coreSection, 'SIGNATURE PHRASES')

  const antiPatterns = extractField(coreSection, 'NEVER USE') ||
                       extractField(coreSection, '[ANTI-PATTERNS]') ||
                       extractBracketedContent(coreSection, 'ANTI-PATTERNS')

  // Extract Mode A (Casual)
  const casualSection = extractSection(promptText, 'MODE A:', 'MODE B')
  const casualStructure = extractField(casualSection, 'STRUCTURE')
  const casualOpenings = extractField(casualSection, 'OPENINGS')
  const casualClosings = extractField(casualSection, 'CLOSINGS')
  const casualExample = extractField(casualSection, 'EXAMPLE')

  // Extract Mode B (Professional)
  const professionalSection = extractSection(promptText, 'MODE B:', 'MODE C')
  const professionalStructure = extractField(professionalSection, 'STRUCTURE')
  const professionalOpenings = extractField(professionalSection, 'OPENINGS')
  const professionalClosings = extractField(professionalSection, 'CLOSINGS')
  const professionalExample = extractField(professionalSection, 'EXAMPLE')

  // Extract Mode C (Formal)
  const formalSection = extractSection(promptText, 'MODE C:')
  const formalStructure = extractField(formalSection, 'STRUCTURE')
  const formalOpenings = extractField(formalSection, 'OPENINGS')
  const formalClosings = extractField(formalSection, 'CLOSINGS')
  const formalExample = extractField(formalSection, 'EXAMPLE')

  return {
    userName,
    coreVoice: {
      toneAnalysis: toneAnalysis || 'Analysis not available',
      vocabularySignatures: vocabularySignatures || 'Signatures not available',
      antiPatterns: antiPatterns || 'Anti-patterns not available',
    },
    modes: {
      casual: {
        structure: casualStructure || 'Structure not specified',
        openings: casualOpenings || 'Openings not specified',
        closings: casualClosings || 'Closings not specified',
        example: casualExample || 'No example available',
      },
      professional: {
        structure: professionalStructure || 'Structure not specified',
        openings: professionalOpenings || 'Openings not specified',
        closings: professionalClosings || 'Closings not specified',
        example: professionalExample || 'No example available',
      },
      formal: {
        structure: formalStructure || 'Structure not specified',
        openings: formalOpenings || 'Openings not specified',
        closings: formalClosings || 'Closings not specified',
        example: formalExample || 'No example available',
      },
    },
    rawText: promptText,
  }
}

/**
 * Extract content in brackets like [TONE ANALYSIS]
 */
function extractBracketedContent(text: string, label: string): string {
  const regex = new RegExp(`\\[${escapeRegex(label)}\\][\\s\\S]*?(?=\\[|NEVER USE|VOCABULARY|$)`, 'i')
  const match = text.match(regex)
  if (match) {
    return match[0].replace(new RegExp(`\\[${escapeRegex(label)}\\]`, 'i'), '').trim()
  }
  return ''
}

/**
 * Get a short preview of the prompt (first N characters)
 */
export function getPromptPreview(promptText: string, maxLength: number = 200): string {
  const cleaned = promptText.replace(/[=\-]{3,}/g, '').replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.slice(0, maxLength) + '...'
}

/**
 * Format a date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
