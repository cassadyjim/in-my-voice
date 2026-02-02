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

export const MODIFICATION_PROMPTS: Record<ModificationType, string> = {
  shorter: 'Make this shorter and more concise while keeping the key points. Reduce by about 30-50%.',
  longer: 'Expand this with more detail, examples, or context. Add about 30-50% more content.',
  more_casual: 'Rewrite this in a more casual, friendly tone. Use contractions, simpler words, and a conversational style.',
  more_professional: 'Rewrite this in a more professional, polished tone. Use formal language and business-appropriate phrasing.',
  more_like_me: 'Rewrite this to sound even more like my natural voice. Emphasize my signature phrases and writing patterns from my IMV profile.',
  clearer: 'Rewrite this to be clearer and easier to understand. Simplify complex sentences and improve the flow.',
  audience_team: 'Adapt this for an internal team audience. Keep it friendly but focused, assuming familiarity with context.',
  audience_client: 'Adapt this for a client audience. Be professional, clear, and ensure it reflects well on our organization.',
  audience_executive: 'Adapt this for an executive audience. Be concise, focus on key takeaways, and use a formal tone.',
  rewrite: 'Generate a completely fresh version of this with the same intent but different wording and structure.',
}
