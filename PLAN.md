# IMV Chat Platform Implementation Plan

## Overview

Transform IMV from a prompt-generator into a **writing-focused chat platform** where users create content (emails, social posts, etc.) in their own voice. The IMV prompt is auto-injected into every conversation.

---

## Core Features

### 1. Persistent Login Sessions
- Configure Supabase auth to use long-lived sessions
- "Remember me" functionality - users stay logged in

### 2. Chat Interface (Primary Feature)
- Simple, clean chat UI similar to ChatGPT/Claude
- Auto-inject user's active IMV prompt into every conversation
- Focus on writing tasks: emails, social posts, LinkedIn, etc.
- Conversation history saved per user

### 3. Platform-Specific Prompt Exports
- Copy buttons for: ChatGPT, Claude, Copilot, Gemini, Generic
- Each optimized for the platform's instruction style
- Available in dashboard for users who prefer external tools

---

## Database Changes

### New Table: `conversations`
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS: Users can only access their own conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);
```

### New Table: `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- RLS: Access through conversation ownership
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access messages in own conversations" ON messages
  FOR ALL USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );

-- Index for fast message retrieval
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
```

### Modify: `prompt_versions` (add platform exports)
```sql
ALTER TABLE prompt_versions ADD COLUMN platform_exports JSONB DEFAULT '{}';
-- Structure: { "chatgpt": "...", "claude": "...", "copilot": "...", "gemini": "...", "generic": "..." }
```

---

## New Files to Create

### API Routes
```
/src/app/api/chat/route.ts          - Main chat endpoint (streams responses)
/src/app/api/conversations/route.ts - CRUD for conversations
/src/app/api/export-prompt/route.ts - Generate platform-specific exports
```

### Pages
```
/src/app/app/chat/page.tsx          - Main chat interface
/src/app/app/chat/[id]/page.tsx     - Specific conversation view
```

### Components
```
/src/app/app/chat/components/
  ├── ChatInterface.tsx      - Main chat container
  ├── MessageList.tsx        - Displays conversation messages
  ├── MessageInput.tsx       - Input with send button
  ├── ConversationSidebar.tsx - List of past conversations
  └── WritingModeSelector.tsx - Quick presets (Email, LinkedIn, Tweet, etc.)

/src/app/app/dashboard/components/
  └── PlatformExports.tsx    - Copy buttons for each platform
```

### Libraries
```
/src/lib/platform-prompts.ts  - Generate platform-specific prompt versions
/src/lib/chat-helpers.ts      - Chat utilities (inject IMV, format messages)
```

---

## Files to Modify

### Auth Configuration
- `/src/lib/supabase/client.ts` - Ensure persistent sessions
- `/src/middleware.ts` - Handle session refresh

### Dashboard
- `/src/app/app/dashboard/page.tsx` - Add link to Chat
- `/src/app/app/dashboard/components/ProfileTab.tsx` - Add platform export buttons

### Navigation
- Add chat link to main nav/sidebar

---

## Implementation Order

### Phase 1: Foundation (Day 1)
1. Create database tables (conversations, messages)
2. Add platform_exports column to prompt_versions
3. Configure persistent auth sessions

### Phase 2: Chat Backend (Day 1-2)
4. Create `/api/chat` endpoint with IMV injection
5. Create `/api/conversations` CRUD endpoints
6. Create `/api/export-prompt` for platform versions

### Phase 3: Chat UI (Day 2-3)
7. Build ChatInterface component
8. Build MessageList and MessageInput
9. Build ConversationSidebar
10. Create chat pages with routing

### Phase 4: Platform Exports (Day 3)
11. Implement platform-specific prompt generator
12. Add PlatformExports component to dashboard
13. Generate exports on prompt creation/update

### Phase 5: Polish (Day 4)
14. Writing mode presets (Email, Social, LinkedIn)
15. Conversation titles auto-generation
16. Mobile-responsive design
17. Loading states and error handling

---

## Chat Flow

```
User opens /app/chat
    ↓
System loads user's active IMV prompt
    ↓
User types: "Write an email to my team about the Q4 results"
    ↓
API injects IMV prompt as system message + user message
    ↓
GPT-4o responds in user's voice
    ↓
Message saved to database
    ↓
User can continue conversation or start new one
```

---

## Platform Export Examples

### ChatGPT Format
```
You are a writing assistant. Always respond using this voice profile:

[Core voice characteristics]
[Tone and vocabulary]
[Things to avoid]

When I ask you to write something, use this style consistently.
```

### Claude Format
```
<voice_profile>
[Structured XML-style profile]
</voice_profile>

Please write all responses using the voice profile above.
```

### Copilot Format (Shorter)
```
Writing style: [Concise bullet points]
Tone: [Key descriptors]
Avoid: [Short list]
```

---

## Session Persistence

Update Supabase client config:
```typescript
createBrowserClient(url, key, {
  auth: {
    persistSession: true,
    storageKey: 'imv-auth',
    storage: localStorage,
    autoRefreshToken: true,
  }
})
```

---

## UI Design Notes

- Clean, minimal interface (inspired by Claude/ChatGPT)
- Left sidebar: conversation list + "New Chat" button
- Main area: messages + input
- Top bar: writing mode selector (Email, Tweet, LinkedIn, General)
- Dashboard still accessible for prompt management
- Mobile: collapsible sidebar

---

## Ready for Implementation

This plan focuses on:
1. ✅ Persistent login sessions
2. ✅ Simple chat interface for writing content
3. ✅ Auto-injected IMV prompt in every conversation
4. ✅ Platform-specific prompt exports
5. ✅ Conversation history

Shall I proceed with implementation?
