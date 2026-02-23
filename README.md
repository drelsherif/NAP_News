# The Neurology AI Pulse — Newsletter Builder v2

A professional React/TypeScript/Vite newsletter builder with full drag-and-drop, 16 modular block types, theme system, RSS ingestion, and HTML export.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| State management | useReducer + Immer (immutable updates) |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| Icons | lucide-react |
| Persistence | localStorage (autosave + versions) |
| Fonts | DM Serif Display, DM Sans, DM Mono (Google Fonts) |

## Project Structure

```
src/
├── types/index.ts          # All TypeScript interfaces
├── data/
│   ├── defaults.ts         # Block factories + default newsletter
│   └── themes.ts           # 4 theme presets + CSS variable application
├── hooks/
│   ├── useNewsletter.ts    # Core state (useReducer + immer)
│   ├── useStorage.ts       # localStorage autosave + versions
│   └── useRss.ts           # RSS feed fetching + parsing
├── utils/
│   └── export.ts           # HTML export + download
├── components/
│   ├── editor/
│   │   ├── TopBar.tsx           # Toolbar with all actions
│   │   ├── Sidebar.tsx          # 5-panel sidebar
│   │   ├── BlockSettingsPanel.tsx # Per-block property editor
│   │   └── Canvas.tsx           # DnD canvas + block selection
│   └── blocks/
│       ├── BlockRenderer.tsx    # Routes block → component
│       └── AllBlocks.tsx        # All 16 block visual components
├── App.tsx                 # Root, wires everything together
├── main.tsx                # Entry point
└── index.css               # Global styles + CSS variables
```

## Block Types (16)

| Category | Blocks |
|----------|--------|
| Structure | Header/Masthead, Scrolling Ticker, Section Divider, Spacer, Footer |
| Content | Article Grid (1/2/3 col), Spotlight Article, Ethics Split, Quick Hits, Text, Image, HTML Embed |
| Education | Prompt Masterclass, SBAR-P Guide, Term of Month, AI Case File, Humor Break |

## Features

### Editor
- **Click to select** any block → controls appear (move up/down, duplicate, delete, settings)
- **Drag handle** (⠿) to drag-reorder
- **Add block between** any two blocks via the `+ Add block here` button
- **Block Settings** panel in sidebar edits all properties for selected block
- **Zoom** 75%–125% from the toolbar
- **Preview Mode** hides all editor chrome for clean reading view

### Images
- Upload images (embedded as base64 data URLs, portable)
- OR reference hosted URLs
- Width: full / wide (80%) / medium (60%) / small (40%)
- Alignment: left / center / right
- Border radius slider
- Optional link URL (clicking image opens URL)
- Alt text and caption

### Articles
- Full fields: title, URL, source, date, image (upload or URL), summary, clinical context, my take, evidence level (High/Moderate/Low/Expert Opinion), tags
- Live URL preview link in settings panel
- Evidence level badge with color coding

### URLs / Links
- All article URLs, image link URLs, footer links validated with href attributes
- URLs open in new tab with rel="noopener noreferrer"
- RSS feed URLs fetched via allorigins.win CORS proxy (configurable)
- Export HTML preserves all links correctly

### RSS
- 4 default PubMed feeds (Neurology AI, Stroke AI, Epilepsy DL, EEG ML)
- Add custom RSS/Atom feeds
- Toggle feeds on/off
- Filter articles by keyword
- Click `+ Add to Issue` to send item to the newsletter

### Themes
- 4 presets: Northwell Blue, Midnight Clinical, Editorial Print, Teal & Sand
- Custom color picker for primary, accent, background, surface
- All colors applied via CSS variables instantly

### Persistence
- **Autosave** every 30 seconds to localStorage
- **Save Version** — up to 20 named snapshots
- **Restore** any version from the Versions panel
- **Export JSON** — download full state as `.json`
- **Import JSON** — reload from any `.json` backup

### Export

This project now supports **pixel-identical** exports by reusing the **same React renderer + CSS** in a read-only Preview route.

#### 1) Export JSON (snapshot)
- In the app: **TopBar → Export JSON**.
- Rename the downloaded file to: `newsletter.json`
- Place it in the project root (same folder as package.json).

#### 2A) Web export folder (host-ready)
Build then generate an export folder containing `dist/` + `newsletter.json`:

```bash
npm run build
npm run export:web
```

Upload the **contents** of `export_web/` to your hosting (GoDaddy / GitHub Pages). It auto-loads **#/preview**.

RSS behavior:
- **Live fetch** runs at runtime when internet is available.
- The last saved snapshot (stored in JSON) is shown when offline.

#### 2B) Single-file export (share/attach)

```bash
npm run build
npm run export:single
```

This creates `export_single.html` which can be opened locally in a browser.

> Note: many email clients strip scripts, so `export_single.html` is best as an attachment or hosted file.

## Extending

### Add a new block type

1. Add the type to `BlockType` union in `src/types/index.ts`
2. Define the interface (e.g. `MyNewBlock`) in `src/types/index.ts`
3. Add it to the `Block` union type
4. Create a factory in `BLOCK_DEFAULTS` in `src/data/defaults.ts`
5. Add a label in `BLOCK_LABELS`
6. Add a group in `BLOCK_GROUPS` in `src/components/editor/Sidebar.tsx`
7. Add a settings component in `BlockSettingsPanel.tsx`
8. Add a visual component in `AllBlocks.tsx`
9. Add a case in `BlockRenderer.tsx`
10. Add a case in `export.ts` → `blockToHtml()`

### Add a theme preset

Add to the `THEMES` array in `src/data/themes.ts`.

## Deployment

```bash
npm run build
# dist/ folder is a static site — host on any CDN, GitHub Pages, Netlify, etc.
```

## RSS CORS Note

The builder uses `https://api.allorigins.win/raw?url=` as the CORS proxy for RSS fetching.
For production, deploy your own Cloudflare Worker proxy (a minimal snippet is included below):

```js
// workers/rss-proxy.js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) return new Response('Missing ?url=', { status: 400 });
    const resp = await fetch(target, { headers: { 'User-Agent': 'NAP-RSS-Proxy' } });
    const headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(resp.body, { status: resp.status, headers });
  }
};
```
