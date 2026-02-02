// Modification types and prompts - shared between client and server
// IMPORTANT: These prompts must RESPECT the user's IMV voice profile

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

// These prompts work WITH the IMV voice profile, not against it
export const MODIFICATION_PROMPTS: Record<ModificationType, string> = {
  shorter: `MODIFICATION: Make this shorter.
- Cut length by 30-50%
- Remove filler and redundancy
- Keep essential message and voice markers
- Preserve the user's signature patterns and sentence rhythm
- Do NOT add new phrases not in the original`,

  longer: `MODIFICATION: Make this longer.
- Expand by 30-50%
- Add context and detail using the user's vocabulary
- Elaborate on key points
- Preserve voice markers and sentence patterns
- Do NOT introduce phrases outside the user's typical style`,

  more_casual: `MODIFICATION: Shift toward Casual mode.
- Use shorter sentences
- Allow fragments if the user uses them
- Relax formality while keeping the user's voice
- Use contractions if the user typically uses them
- Do NOT add slang, greetings, or phrases not evidenced in the user's profile
- Stay within the user's vocabulary`,

  more_professional: `MODIFICATION: Shift toward Professional mode.
- Use complete sentences
- Reduce contractions
- Add appropriate structure
- Keep the user's voice markers
- Do NOT add corporate jargon not in the user's profile`,

  more_like_me: `MODIFICATION: Intensify personal voice.
- Increase use of the user's signature phrases
- Match their typical sentence rhythm more closely
- Follow their message arc pattern
- Use their preferred openings/closings
- Remove any phrases that feel generic or AI-like`,

  clearer: `MODIFICATION: Improve clarity.
- Simplify complex sentences
- Use plain language
- Improve logical flow
- Keep the user's voice and vocabulary
- Do NOT introduce new phrases`,

  audience_team: `MODIFICATION: Adapt for internal team.
- Shift toward Casual mode rules
- Assume shared context
- Be direct and brief
- Use the user's casual patterns
- Do NOT add slang or phrases not in the user's profile`,

  audience_client: `MODIFICATION: Adapt for client/external audience.
- Shift toward Professional mode rules
- Explain context where needed
- Be warm but professional
- Use the user's professional patterns
- Stay within the user's vocabulary`,

  audience_executive: `MODIFICATION: Adapt for executive audience.
- Shift toward Formal mode rules
- Lead with the key point
- Be extremely concise
- Focus on decisions and impact
- Use the user's formal patterns`,

  rewrite: `MODIFICATION: Generate a fresh version.
- Same message, different structure
- New opening and closing from the user's typical patterns
- Vary sentence structure while maintaining voice
- Do NOT introduce phrases outside the user's profile
- This should still sound like the user`,
}
