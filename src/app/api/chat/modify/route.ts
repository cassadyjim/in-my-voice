import { createClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { MODIFICATION_PROMPTS, type ModificationType } from '@/app/app/chat/components/MessageModifyControls'

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

    // Get user's active IMV prompt
    const { data: activePrompt } = await supabase
      .from('prompt_versions')
      .select('prompt_text')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Build the modification request
    const modificationInstruction = MODIFICATION_PROMPTS[modification_type]

    const systemPrompt = activePrompt
      ? `${activePrompt.prompt_text}

---

You are helping modify content while maintaining the user's voice profile above.`
      : 'You are a helpful writing assistant.'

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Here is the content to modify:

---
${original_content}
---

Modification requested: ${modificationInstruction}

Please provide the modified version only, without any explanation or preamble.`,
      },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: Math.min(temperature + 0.1, 1.0), // Slightly higher temp for variations
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
