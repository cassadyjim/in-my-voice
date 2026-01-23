import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { samples, totalWords } = await request.json()

    if (!samples || samples.length === 0) {
      return NextResponse.json(
        { error: 'No writing samples provided' },
        { status: 400 }
      )
    }

    // Combine all samples
    const combinedText = samples.join('\n\n---\n\n')

    // Generate IMV prompt using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert writing style analyst. Analyze the provided writing samples and create a comprehensive "voice prompt" that captures the author's unique writing style.

The voice prompt should include:
- Tone (formal, casual, warm, direct, etc.)
- Sentence structure patterns (length, complexity, use of fragments)
- Vocabulary level and word choices
- Punctuation signature (commas, dashes, exclamation points)
- Opening and closing patterns
- Signature phrases or expressions
- Paragraph structure preferences

Format the output as a clear, detailed prompt that can be given to an AI to replicate this writing style. Start with: "Write in this voice:"

The prompt should be 200-300 words and actionable.`
        },
        {
          role: 'user',
          content: `Analyze these writing samples (${totalWords} words total) and create a voice prompt:\n\n${combinedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
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
