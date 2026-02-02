import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const IMV_TEMPLATE = `IMV STYLE PROFILE - [USER NAME]
Interactive Voice System v1.0

===========================================
INSTRUCTIONS FOR AI ASSISTANT:
===========================================

Write all content in the user's authentic voice using the profile below.
Adapt formality based on context clues in the request (email to boss = more formal, Slack to teammate = casual).
If unclear, default to professional tone.

===========================================
CORE VOICE FOUNDATION
===========================================

[TONE ANALYSIS]

VOCABULARY SIGNATURES:
[SIGNATURE PHRASES]

NEVER USE:
[ANTI-PATTERNS]

===========================================
FORMALITY ADAPTATIONS
===========================================

CASUAL (team messages, Slack, quick updates):
- Structure: [SENTENCE LENGTH, PARAGRAPH PATTERNS]
- Markers: [FRAGMENTS, CONTRACTIONS, FLOW]
- Openings: [GREETING PATTERNS]
- Closings: [SIGN-OFF PATTERNS]

PROFESSIONAL (clients, external emails, business):
- Structure: [BALANCED PATTERNS]
- Openings: [PROFESSIONAL GREETINGS]
- Closings: [PROFESSIONAL SIGN-OFFS]
- Punctuation: [SIGNATURE PUNCTUATION USE]

FORMAL (executives, board, official):
- Structure: [POLISHED PATTERNS]
- Voice preservation: [AUTHENTICITY PRESERVERS]
- Openings: [FORMAL GREETINGS]
- Closings: [FORMAL SIGN-OFFS]

===========================================
Always write in [USER NAME]'s authentic voice.
===========================================`

export async function POST(request: NextRequest) {
  try {
    const { samples, totalWords } = await request.json()

    if (!samples || samples.length === 0) {
      return NextResponse.json(
        { error: 'No writing samples provided' },
        { status: 400 }
      )
    }

    const combinedText = samples.join('\n\n---\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating IMV (In My Voice) prompts that enable AI to write in someone's authentic voice.

Your task: Analyze writing samples and fill in this IMV template with SPECIFIC, ACTIONABLE patterns.

CRITICAL RULES:
1. Be DIRECTIVE, not descriptive ("Use fragments" not "tends to use fragments")
2. Extract EXACT signature phrases from the samples
3. List SPECIFIC anti-patterns to avoid (corporate fluff the user never uses)
4. Include REAL examples from the user's actual writing
5. Make it ENFORCEABLE - clear do's and don'ts
6. Capture STRATEGIC voice, not just tone

Template structure to fill:
${IMV_TEMPLATE}

Focus on:
- Exact vocabulary they use repeatedly
- Sentence structure patterns (lengths, fragments, flow)
- Punctuation signatures (dashes, parentheses, etc.)
- Opening/closing patterns
- Things they NEVER say (very important!)
- Context switching (casual vs professional vs formal)

Output a complete, ready-to-use IMV prompt that produces consistent, authentic writing.`
        },
        {
          role: 'user',
          content: `Analyze these writing samples (${totalWords} words total) and create a complete IMV prompt:\n\n${combinedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000  // Increased for longer, more detailed output
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
