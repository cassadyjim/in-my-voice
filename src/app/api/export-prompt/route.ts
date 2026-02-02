import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generatePlatformExports, generateForPlatform } from '@/lib/platform-prompts'
import type { PlatformName } from '@/types/chat'

// GET /api/export-prompt - Get platform-specific prompt
// Query params: ?platform=chatgpt|claude|copilot|gemini|generic
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') as PlatformName | null

    // Get user's active prompt
    const { data: activePrompt, error: promptError } = await supabase
      .from('prompt_versions')
      .select('id, prompt_text, platform_exports')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (promptError || !activePrompt) {
      return NextResponse.json(
        { error: 'No active IMV prompt found' },
        { status: 404 }
      )
    }

    // If no specific platform requested, return all
    if (!platform) {
      // Check if we have cached exports
      if (activePrompt.platform_exports && Object.keys(activePrompt.platform_exports).length > 0) {
        return NextResponse.json({ exports: activePrompt.platform_exports })
      }

      // Generate all exports
      const exports = generatePlatformExports(activePrompt.prompt_text)

      // Cache them in the database
      await supabase
        .from('prompt_versions')
        .update({ platform_exports: exports })
        .eq('id', activePrompt.id)

      return NextResponse.json({ exports })
    }

    // Validate platform name
    const validPlatforms: PlatformName[] = ['chatgpt', 'claude', 'copilot', 'gemini', 'generic']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Valid options: ${validPlatforms.join(', ')}` },
        { status: 400 }
      )
    }

    // Check cache first
    if (activePrompt.platform_exports?.[platform]) {
      return NextResponse.json({
        platform,
        prompt: activePrompt.platform_exports[platform],
      })
    }

    // Generate for specific platform
    const prompt = generateForPlatform(activePrompt.prompt_text, platform)

    // Update cache
    const updatedExports = {
      ...(activePrompt.platform_exports || {}),
      [platform]: prompt,
    }
    await supabase
      .from('prompt_versions')
      .update({ platform_exports: updatedExports })
      .eq('id', activePrompt.id)

    return NextResponse.json({ platform, prompt })
  } catch (error) {
    console.error('Export prompt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/export-prompt - Regenerate all platform exports
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

    // Get user's active prompt
    const { data: activePrompt, error: promptError } = await supabase
      .from('prompt_versions')
      .select('id, prompt_text')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (promptError || !activePrompt) {
      return NextResponse.json(
        { error: 'No active IMV prompt found' },
        { status: 404 }
      )
    }

    // Generate fresh exports
    const exports = generatePlatformExports(activePrompt.prompt_text)

    // Save to database
    const { error: updateError } = await supabase
      .from('prompt_versions')
      .update({ platform_exports: exports })
      .eq('id', activePrompt.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save exports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Platform exports regenerated successfully',
      exports,
    })
  } catch (error) {
    console.error('Export prompt regenerate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
