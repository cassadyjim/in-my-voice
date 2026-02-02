import { createClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { MODIFICATION_PROMPTS, type ModificationType } from '@/lib/modification-prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      conversation_id,
      original_content,
      modification_type,
      temperature = 0.7,
    } = body as {
      conversation_id: string
      original_content: string
      modification_type: ModificationType
      temperature?: number
    }

    if (!conversation_id || !original_content || !modification_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user's active IMV prompt - FULL prompt, not truncated
    const { data: activePrompt } = await supabase
      .from('prompt_versions')
      .select('prompt_text')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const modificationInstruction = MODIFICATION_PROMPTS[modification_type]

    // IMV VOICE IS PRIMARY - modification is the specific task
    const systemPrompt = activePrompt
      ? `${activePrompt.prompt_text}

===========================================
MODIFICATION TASK
===========================================

${modificationInstruction}

CRITICAL RULES FOR THIS MODIFICATION:
1. The IMV voice profile above is PRIMARY - maintain it throughout
2. Apply the modification while staying within the user's voice
3. Do NOT introduce words, phrases, or patterns not in the voice profile
4. Check the Avoidance Patterns section - do not use those phrases
5. Use only Signature Patterns that fit the context
6. The result must still sound like the user wrote it

OUTPUT:
- Output ONLY the modified text
- No explanations or preamble
- Just the final content in the user's voice`
      : `You are a helpful writing assistant.

${modificationInstruction}

OUTPUT:
- Output ONLY the modified text
- No explanations or preamble`

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Apply the modification to this content while maintaining my voice:

${original_content}`,
      },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: temperature,
      max_tokens: 2000,
    })

    const modifiedContent = completion.choices[0]?.message?.content || ''

    // Save as a new assistant message in the conversation
    const { data: savedMsg, error: saveError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        role: 'assistant',
        content: modifiedContent,
      })
      .select('id, role, content, created_at')
      .single()

    if (saveError) {
      return NextResponse.json(
        { error: 'Failed to save modified message' },
        { status: 500 }
      )
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id)

    return NextResponse.json({
      message: savedMsg,
      modification_type,
    })
  } catch (error) {
    console.error('Modify API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
