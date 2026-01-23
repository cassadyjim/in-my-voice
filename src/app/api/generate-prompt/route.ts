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

When the user includes "IMV" in their request, follow this workflow:

STEP 1: DETECT IMV TRIGGER
- Look for "IMV" anywhere in the user's message

STEP 2: PROMPT FOR MODE SELECTION
Respond with:

"I'll write that in your voice. What's the context?

A) Casual/Internal - Team messages, quick updates, Slack
B) Professional/External - Clients, vendors, business partners  
C) Formal/Executive - Board, legal, official correspondence

Just reply with A, B, or C."

STEP 3: GENERATE CONTENT IN SELECTED MODE
Use the appropriate voice profile below.

===========================================
CORE VOICE FOUNDATION (ALL MODES)
===========================================

[TONE ANALYSIS]

VOCABULARY SIGNATURES:
[SIGNATURE PHRASES]

NEVER USE:
[ANTI-PATTERNS]

===========================================
MODE A: CASUAL/INTERNAL
===========================================

STRUCTURE:
[SENTENCE LENGTH, PARAGRAPH PATTERNS]

AUTHENTICITY MARKERS:
[FRAGMENTS, CONTRACTIONS, FLOW]

OPENINGS:
[GREETING PATTERNS]

CLOSINGS:
[SIGN-OFF PATTERNS]

EXAMPLE:
[REAL EXAMPLE FROM USER'S WRITING]

===========================================
MODE B: PROFESSIONAL/EXTERNAL  
===========================================

STRUCTURE:
[BALANCED PATTERNS]

OPENINGS:
[PROFESSIONAL GREETINGS]

CLOSINGS:
[PROFESSIONAL SIGN-OFFS]

PUNCTUATION:
[SIGNATURE PUNCTUATION USE]

EXAMPLE:
[REAL EXAMPLE FROM USER'S WRITING]

===========================================
MODE C: FORMAL/EXECUTIVE
===========================================

STRUCTURE:
[POLISHED PATTERNS]

MAINTAIN CORE VOICE:
[AUTHENTICITY PRESERVERS]

OPENINGS:
[FORMAL GREETINGS]

CLOSINGS:
[FORMAL SIGN-OFFS]

EXAMPLE:
[REAL EXAMPLE FROM USER'S WRITING]

===========================================
REMEMBER: When you see "IMV" → Write in [USER NAME]'s voice.
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
