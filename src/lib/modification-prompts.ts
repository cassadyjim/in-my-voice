// Modification types and prompts - shared between client and server

export type ModificationType =
  | 'shorter'
  | 'longer'
  | 'more_casual'
  | 'more_professional'
  | 'more_like_me'
  | 'clearer'
  | 'audience_team'
  | 'audience_client'
  | 'audience_executive'
  | 'rewrite'

// These prompts are designed to be ASSERTIVE and override default behavior
export const MODIFICATION_PROMPTS: Record<ModificationType, string> = {
  shorter: `CRITICAL INSTRUCTION: Make this SIGNIFICANTLY shorter.
- Cut the length by AT LEAST 40-50%
- Remove all filler words, redundant phrases, and unnecessary details
- Keep only the essential message
- Combine sentences where possible
- This MUST be noticeably shorter than the original`,

  longer: `CRITICAL INSTRUCTION: Make this SIGNIFICANTLY longer.
- Expand by AT LEAST 40-50% more content
- Add more context, details, and examples
- Elaborate on key points
- Add supporting information
- This MUST be noticeably longer than the original`,

  more_casual: `CRITICAL INSTRUCTION: Make this MUCH more casual and relaxed.
- Use contractions (I'm, you're, we'll, etc.)
- Use informal language and shorter sentences
- Add friendly touches (hey, thanks, cheers, etc.)
- Remove formal business language completely
- Make it sound like talking to a friend
- This MUST feel significantly more casual than the original`,

  more_professional: `CRITICAL INSTRUCTION: Make this MUCH more professional and polished.
- Remove all contractions
- Use formal business language
- Remove casual expressions and slang
- Use complete, well-structured sentences
- Add professional courtesies
- This MUST feel significantly more formal than the original`,

  more_like_me: `CRITICAL INSTRUCTION: Intensify the personal voice characteristics.
- Use MORE of the signature phrases from the voice profile
- Emphasize the unique vocabulary patterns
- Make sentence structure match the profile more closely
- This should sound UNMISTAKABLY like the user's voice`,

  clearer: `CRITICAL INSTRUCTION: Make this MUCH clearer and easier to understand.
- Break complex sentences into simpler ones
- Use plain language instead of jargon
- Organize information logically
- Add transition words for flow
- Remove ambiguity
- A 10-year-old should be able to understand the main point`,

  audience_team: `CRITICAL INSTRUCTION: Rewrite for an internal team audience.
- Use casual, friendly language
- Assume shared context and knowledge
- Be direct and skip formalities
- Use "we" and "us" language
- Keep it brief and action-oriented`,

  audience_client: `CRITICAL INSTRUCTION: Rewrite for a client/external audience.
- Be professional but warm
- Explain context that might not be obvious
- Focus on value and benefits to them
- Be respectful of their time
- Use "you" focused language`,

  audience_executive: `CRITICAL INSTRUCTION: Rewrite for an executive audience.
- Lead with the key point/ask upfront
- Be extremely concise
- Focus on business impact and decisions needed
- Remove all unnecessary detail
- Use bullet points if listing multiple items
- Maximum 3-4 sentences unless absolutely necessary`,

  rewrite: `CRITICAL INSTRUCTION: Generate a COMPLETELY DIFFERENT version.
- Same core message but entirely new wording
- Different sentence structures
- Different opening and closing
- This should NOT look like a minor edit - it should be a fresh take
- Keep the same intent but express it in a new way`,
}
