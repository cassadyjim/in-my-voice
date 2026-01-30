import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MODE_NAMES: Record<string, string> = {
  A: 'CASUAL/INTERNAL',
  B: 'PROFESSIONAL/EXTERNAL',
  C: 'FORMAL/EXECUTIVE',
}

const MODE_DESCRIPTIONS: Record<string, string> = {
  A: 'casual, friendly, for team members and internal communication',
  B: 'professional, balanced, for clients and business partners',
  C: 'formal, polished, for board members, legal, and official correspondence',
}

/**
 * Extract the relevant mode section from the full IMV prompt
 */
function extractModeSection(promptText: string, mode: string): string {
  const modeLabel = `MODE ${mode}:`
  const nextModes = ['MODE A:', 'MODE B:', 'MODE C:', 'REMEMBER:']

  const startIndex = promptText.indexOf(modeLabel)
  if (startIndex === -1) {
    return '' // Mode section not found
  }

  let endIndex = promptText.length
  for (const nextMode of nextModes) {
    if (nextMode === modeLabel) continue
    const nextIndex = promptText.indexOf(nextMode, startIndex + modeLabel.length)
    if (nextIndex !== -1 && nextIndex < endIndex) {
      endIndex = nextIndex
    }
  }

  return promptText.slice(startIndex, endIndex).trim()
}

/**
 * Extract the core voice foundation from the prompt
 */
function extractCoreVoice(promptText: string): string {
  const startMarker = 'CORE VOICE FOUNDATION'
  const endMarkers = ['MODE A:', '=====']

  const startIndex = promptText.indexOf(startMarker)
  if (startIndex === -1) return ''

  let endIndex = promptText.length
  for (const marker of endMarkers) {
    const idx = promptText.indexOf(marker, startIndex + startMarker.length)
    if (idx !== -1 && idx < endIndex) {
      endIndex = idx
    }
  }

  return promptText.slice(startIndex, endIndex).trim()
}

export async function POST(request: NextRequest) {
  try {
    const { mode, testRequest, promptText } = await request.json()

    if (!mode || !testRequest || !promptText) {
      return NextResponse.json(
        { error: 'Missing required fields: mode, testRequest, promptText' },
        { status: 400 }
      )
    }

    if (!['A', 'B', 'C'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be A, B, or C' },
        { status: 400 }
      )
    }

    // Extract relevant sections from the prompt
    const coreVoice = extractCoreVoice(promptText)
    const modeSection = extractModeSection(promptText, mode)
    const modeName = MODE_NAMES[mode]
    const modeDescription = MODE_DESCRIPTIONS[mode]

    // Build the system prompt
    const systemPrompt = `You are an AI assistant that writes in a specific person's voice and style.

${coreVoice ? `CORE VOICE RULES:\n${coreVoice}\n` : ''}

${modeSection ? `CURRENT MODE - ${modeName}:\n${modeSection}\n` : ''}

WRITING INSTRUCTIONS:
- Write in ${modeDescription} tone
- Follow all voice patterns, vocabulary signatures, and style rules above
- Avoid any anti-patterns or phrases marked as "NEVER USE"
- Match the sentence structure and length patterns specified
- Use the openings and closings appropriate for this mode
- Write naturally as if you ARE this person, not imitating them

OUTPUT RULES:
- Write ONLY the requested content
- Do NOT include explanations, meta-commentary, or notes
- Do NOT use phrases like "Here's..." or "Sure, here you go..."
- Start directly with the content`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testRequest },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content generated')
    }

    return NextResponse.json({ content })

  } catch (error: unknown) {
    console.error('Error generating test content:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate content'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
