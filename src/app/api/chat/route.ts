import { createClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import type { WritingMode } from '@/types/chat'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Writing mode context additions
const WRITING_MODE_CONTEXT: Record<WritingMode, string> = {
  general: '',
  email: `
The user is writing an email. Structure your response as a complete email with:
- Appropriate greeting
- Clear body paragraphs
- Professional sign-off
Match the formality to the context (internal vs external, peer vs executive).`,
  linkedin: `
The user is writing a LinkedIn post. Make it:
- Engaging hook in the first line
- Easy to scan (short paragraphs, line breaks)
- Professional but personable
- Include a call-to-action or question at the end
- Appropriate length (150-300 words for posts)`,
  twitter: `
The user is writing for Twitter/X. Make it:
- Punchy and concise (under 280 characters for single tweets)
- If it's a thread, number each tweet and keep them standalone but connected
- Conversational and engaging
- Use line breaks for readability`,
  slack: `
The user is writing a Slack message. Make it:
- Concise and scannable
- Friendly but professional
- Use bullet points if listing multiple items
- Direct and action-oriented`,
  formal_letter: `
The user is writing a formal letter. Structure it with:
- Proper letter formatting (date, addresses if needed)
- Formal salutation
- Clear, well-organized paragraphs
- Professional closing
- Formal tone throughout`,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
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
      message,
      writing_mode = 'general',
      temperature = 0.7,
    } = body as {
      conversation_id?: string
      message: string
      writing_mode?: WritingMode
      temperature?: number
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get user's active IMV prompt
    const { data: activePrompt, error: promptError } = await supabase
      .from('prompt_versions')
      .select('prompt_text')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (promptError || !activePrompt) {
      return NextResponse.json(
        { error: 'No active IMV prompt found. Please create one first.' },
        { status: 400 }
      )
    }

    // Get or create conversation
    let convId = conversation_id
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: user.id })
        .select('id')
        .single()

      if (convError || !newConv) {
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }
      convId = newConv.id
    }

    // Get conversation history (last 10 messages for context)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Save user message
    const { error: userMsgError } = await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
    })

    if (userMsgError) {
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Build system prompt with IMV + writing mode context
    const systemPrompt = `${activePrompt.prompt_text}

---

You are helping the user write content in their personal voice as defined above.
${WRITING_MODE_CONTEXT[writing_mode]}

Important:
- Always match the user's voice profile
- Use their signature phrases and vocabulary naturally
- Never use words/phrases from their "avoid" list
- Match the appropriate formality level for the task`

    // Build messages array for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Add conversation history
    if (history) {
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          })
        }
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message })

    // Call OpenAI with user-specified creativity level
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: Math.max(0.1, Math.min(1.0, temperature)), // Clamp between 0.1 and 1.0
      max_tokens: 2000,
    })

    const assistantMessage = completion.choices[0]?.message?.content || ''

    // Save assistant response
    const { data: savedMsg, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: assistantMessage,
      })
      .select('id, role, content, created_at')
      .single()

    if (assistantMsgError) {
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId)

    return NextResponse.json({
      conversation_id: convId,
      message: savedMsg,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
