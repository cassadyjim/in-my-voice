#!/usr/bin/env node
/**
 * Upload IMV Master Prompt to Supabase
 *
 * Usage: node scripts/upload-prompt.js [path-to-prompt-file]
 *
 * If no path provided, defaults to: src/lib/imv-builder-prompt.txt
 */

require('dotenv').config({ path: '.env.local' })

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function uploadPrompt() {
  // Get file path from args or use default
  const filePath = process.argv[2] || path.join(__dirname, '..', 'src', 'lib', 'imv-builder-prompt.txt')

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    process.exit(1)
  }

  // Read the prompt file
  const promptText = fs.readFileSync(filePath, 'utf8')
  console.log(`📄 Read prompt file: ${filePath}`)
  console.log(`   Length: ${promptText.length} characters`)

  try {
    // Get the current active prompt to find user_id and version
    const { data: currentPrompt, error: fetchError } = await supabase
      .from('prompt_versions')
      .select('id, user_id, version_num')
      .eq('is_active', true)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching current prompt:', fetchError.message)
      process.exit(1)
    }

    if (!currentPrompt) {
      console.error('❌ No active prompt found in database')
      process.exit(1)
    }

    console.log(`📝 Found active prompt (version ${currentPrompt.version_num})`)

    // Deactivate current prompt
    await supabase
      .from('prompt_versions')
      .update({ is_active: false })
      .eq('id', currentPrompt.id)

    // Insert new version
    const { data: newPrompt, error: insertError } = await supabase
      .from('prompt_versions')
      .insert({
        user_id: currentPrompt.user_id,
        version_num: currentPrompt.version_num + 1,
        prompt_text: promptText,
        is_active: true,
        generation_params: { source: 'manual_upload', uploaded_at: new Date().toISOString() }
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting new prompt:', insertError.message)
      // Reactivate the old prompt
      await supabase
        .from('prompt_versions')
        .update({ is_active: true })
        .eq('id', currentPrompt.id)
      process.exit(1)
    }

    console.log(`✅ Successfully uploaded as version ${currentPrompt.version_num + 1}`)
    console.log(`   Prompt ID: ${newPrompt.id}`)

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    process.exit(1)
  }
}

uploadPrompt()
