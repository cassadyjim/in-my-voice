import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Read the prompt from the external file
function getBuilderPrompt(): string {
  try {
    const promptPath = join(process.cwd(), 'src/lib/imv-builder-prompt.txt')
    return readFileSync(promptPath, 'utf-8')
  } catch (error) {
    console.error('Failed to read IMV builder prompt file:', error)
    throw new Error('IMV builder prompt file not found')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { samples, totalWords } = await request.json()

    if (!samples || samples.length === 0) {
      return NextResponse.json(
        { error: 'No writing samples provided' },
        { status: 400 }
      )
    }

    const combinedText = samples.join('\n\n---SAMPLE BREAK---\n\n')
    const builderPrompt = getBuilderPrompt()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: builderPrompt
        },
        {
          role: 'user',
          content: `Analyze these ${samples.length} writing samples (${totalWords} words total) and generate a complete IMV voice profile.

CRITICAL REMINDERS:
- Extract patterns FROM these samples, not generic writing advice
- Quote exact phrases the user actually wrote
- Identify avoidance patterns by what's ABSENT, not from a generic list
- Make examples sound like THIS person
- Every rule must be traceable to evidence in the samples

WRITING SAMPLES:

${combinedText}

Generate the complete IMV prompt now. Start with "## 1. VOICE IDENTITY & ROLE DEFINITION"`
        }
      ],
      temperature: 0.5,
      max_tokens: 4500
    })

    const prompt = completion.choices[0]?.message?.content

    if (!prompt) {
      throw new Error('No prompt generated')
    }

    return NextResponse.json({ prompt })

  } catch (error: any) {
    console.error('Error generating prompt:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate prompt' },
      { status: 500 }
    )
  }
}
