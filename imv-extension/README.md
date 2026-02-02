# IMV Chrome Extension

Auto-inject your In My Voice prompt into ChatGPT.

## Setup Instructions

### 1. Configure Supabase Credentials

Edit `src/lib/supabase.ts` and replace the placeholder values with your actual Supabase credentials:

```typescript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co'  // from .env.local
const SUPABASE_ANON_KEY = 'your-anon-key-here'           // from .env.local
```

You can find these in your IMV project's `.env.local` file.

### 2. Create Icons

The extension needs PNG icons. Create these files in `src/icons/`:
- `icon-16.png` (16x16 pixels)
- `icon-48.png` (48x48 pixels)
- `icon-128.png` (128x128 pixels)

You can use any image editor or online tool to create a simple microphone icon.

### 3. Install Dependencies

```bash
cd imv-extension
npm install
```

### 4. Build the Extension

```bash
npm run build
```

This creates a `dist` folder with the compiled extension.

### 5. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder

### 6. Test It

1. Click the extension icon in Chrome toolbar
2. Log in with your IMV email (magic link)
3. Go to https://chat.openai.com
4. You should see an "Add IMV" button near the message input
5. Click it to inject your voice prompt!

## Development

Watch mode (auto-rebuild on changes):
```bash
npm run watch
```

After changes, go to `chrome://extensions` and click the refresh button on the extension.

## Troubleshooting

**"No prompt found"** - Make sure you've generated an IMV prompt on the dashboard first.

**Button not appearing** - ChatGPT's UI changes frequently. Try refreshing the page.

**Login not working** - Check that the Supabase credentials match your IMV app.

## File Structure

```
imv-extension/
├── dist/                 # Built extension (after npm run build)
├── src/
│   ├── background.ts     # Service worker
│   ├── content.ts        # ChatGPT injector
│   ├── content.css       # Styles for injected elements
│   ├── lib/
│   │   └── supabase.ts   # Supabase client
│   ├── popup/
│   │   ├── popup.html    # Extension popup UI
│   │   ├── popup.ts      # Popup logic
│   │   └── popup.css     # Popup styles
│   └── icons/            # Extension icons
├── manifest.json         # Extension manifest
├── package.json
├── tsconfig.json
└── webpack.config.js
```
