import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { feedback, currentPromptText } = await request.json()

    if (!feedback || !currentPromptText) {
      return NextResponse.json(
        { error: 'Missing required fields: feedback, currentPromptText' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert at refining IMV (In My Voice) prompts that help AI assistants write in someone's authentic voice.

TASK: Refine the given IMV prompt based on user feedback while preserving its core structure and format.

CRITICAL RULES:
1. MAINTAIN the exact same template structure and section headers
2. PRESERVE all content that isn't related to the feedback
3. Make TARGETED changes based on the specific feedback
4. Keep the IMV format with all modes (A, B, C) intact
5. Ensure the refined prompt is IMMEDIATELY usable - no placeholders
6. Be DIRECTIVE in your language ("Use..." not "tends to use...")

OUTPUT RULES:
- Return ONLY the refined prompt text
- Do NOT include any explanations, notes, or commentary
- Do NOT wrap in markdown code blocks
- Start directly with "IMV STYLE PROFILE" header
- The output should be ready to copy-paste into an AI assistant`

    const userPrompt = `Here is the current IMV prompt:

---
${currentPromptText}
---

User feedback for refinement:
"${feedback}"

Please refine the prompt to incorporate this feedback while keeping the overall structure intact. Return only the refined prompt.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    })

    const refinedPrompt = completion.choices[0]?.message?.content

    if (!refinedPrompt) {
      throw new Error('No refined prompt generated')
    }

    // Clean up any markdown code blocks if present
    let cleanedPrompt = refinedPrompt
      .replace(/^```[\w]*\n?/gm, '')
      .replace(/\n?```$/gm, '')
      .trim()

    return NextResponse.json({ refinedPrompt: cleanedPrompt })

  } catch (error: unknown) {
    console.error('Error refining prompt:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to refine prompt'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
