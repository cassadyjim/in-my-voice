import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
    const { phrase, rule_type } = body as {
      phrase: string
      rule_type: 'avoid' | 'prefer'
    }

    if (!phrase || !rule_type) {
      return NextResponse.json(
        { error: 'Missing phrase or rule_type' },
        { status: 400 }
      )
    }

    // Get user's active IMV prompt
    const { data: activePrompt, error: fetchError } = await supabase
      .from('prompt_versions')
      .select('id, prompt_text')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (fetchError || !activePrompt) {
      return NextResponse.json(
        { error: 'No active prompt found' },
        { status: 404 }
      )
    }

    // Check if the phrase is already in the prompt
    if (activePrompt.prompt_text.toLowerCase().includes(phrase.toLowerCase())) {
      // Check if it's already in an avoidance section
      const avoidanceSection = activePrompt.prompt_text.match(/Avoidance Patterns[\s\S]*?(?=##|$)/i)
      if (avoidanceSection && avoidanceSection[0].toLowerCase().includes(phrase.toLowerCase())) {
        return NextResponse.json({
          success: true,
          message: 'This phrase is already in your avoidance patterns',
          already_exists: true,
        })
      }
    }

    // Build the rule addition
    const ruleAddition = rule_type === 'avoid'
      ? `\n- "${phrase}" — User-added avoidance (do not use this phrase)`
      : `\n- "${phrase}" — User-added preference (use naturally when appropriate)`

    // Find the appropriate section to append to
    let updatedPrompt = activePrompt.prompt_text

    if (rule_type === 'avoid') {
      // Look for the Avoidance Patterns section
      const avoidanceMatch = updatedPrompt.match(/(### B\. Rarely or Never Used Language \(Avoidance Patterns\)[\s\S]*?)(?=###|## \d|$)/i)

      if (avoidanceMatch) {
        // Insert before the next section
        const insertPoint = avoidanceMatch.index! + avoidanceMatch[0].length
        updatedPrompt =
          updatedPrompt.slice(0, insertPoint).trimEnd() +
          ruleAddition +
          '\n' +
          updatedPrompt.slice(insertPoint)
      } else {
        // Fallback: append to end of Section 3
        const section3Match = updatedPrompt.match(/(## 3\. LANGUAGE PATTERN ANALYSIS[\s\S]*?)(?=## 4|$)/i)
        if (section3Match) {
          const insertPoint = section3Match.index! + section3Match[0].length
          updatedPrompt =
            updatedPrompt.slice(0, insertPoint).trimEnd() +
            '\n\n### User-Added Avoidance Patterns' +
            ruleAddition +
            '\n' +
            updatedPrompt.slice(insertPoint)
        } else {
          // Last resort: append to end
          updatedPrompt += '\n\n## USER-ADDED RULES\n\n### Avoidance Patterns' + ruleAddition
        }
      }
    } else {
      // For preferred phrases, add to Signature Patterns
      const signatureMatch = updatedPrompt.match(/(### A\. Commonly Used Language \(Signature Patterns\)[\s\S]*?)(?=###|## \d|$)/i)

      if (signatureMatch) {
        const insertPoint = signatureMatch.index! + signatureMatch[0].length
        updatedPrompt =
          updatedPrompt.slice(0, insertPoint).trimEnd() +
          ruleAddition +
          '\n' +
          updatedPrompt.slice(insertPoint)
      } else {
        updatedPrompt += '\n\n## USER-ADDED RULES\n\n### Preferred Phrases' + ruleAddition
      }
    }

    // Update the prompt in the database
    const { error: updateError } = await supabase
      .from('prompt_versions')
      .update({ prompt_text: updatedPrompt })
      .eq('id', activePrompt.id)

    if (updateError) {
      console.error('Failed to update prompt:', updateError)
      return NextResponse.json(
        { error: 'Failed to update prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: rule_type === 'avoid'
        ? `"${phrase}" added to avoidance patterns`
        : `"${phrase}" added to preferred phrases`,
      phrase,
      rule_type,
    })

  } catch (error) {
    console.error('Add rule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
