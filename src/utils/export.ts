import type { Newsletter, Block } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


function normalizeTerms(terms: any): string[] {
  if (!terms) return [];
  if (Array.isArray(terms)) return terms.filter(Boolean).map(String);
  if (typeof terms === 'string') {
    // Support comma-separated or newline-separated lists; fallback to splitting on '  ' is avoided.
    const parts = terms.split(/\s*,\s*|\n+/g).map(s => s.trim()).filter(Boolean);
    return parts.length ? parts : [terms.trim()];
  }
  return [String(terms)];
}

function getExportCss(theme: Newsletter['theme'], baseFontPx?: number): string {
  const base = Number.isFinite(baseFontPx as any) ? `html{font-size:${baseFontPx}px}` : '';
  return `
:root {
  --c-primary: ${theme.primary};
  --c-secondary: ${theme.secondary};
  --c-accent: ${theme.accent};
  --c-bg: ${theme.background};
  --c-surface: ${theme.surface};
  --c-border: ${theme.border};
  --c-text: ${theme.text};
  --c-muted: ${theme.muted};
  --f-display: ${theme.fontDisplay};
  --f-body: ${theme.fontBody};
  --f-mono: ${theme.fontMono};
}
*,*::before,*::after { box-sizing: border-box; }
${base}
html, body { margin: 0; height: auto !important; overflow: auto !important; }
body {
  font-family: var(--f-body);
  color: var(--c-text);
  background: var(--c-bg);
  padding: 22px 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
/* Match builder: links default to accent; white sections inherit; ticker stays white */
a { color: var(--c-accent); text-decoration: none; }
a:hover { text-decoration: underline; }
/* Ticker links always white */
.nap-ticker a { color: inherit !important; text-decoration: none !important; }
.nap-ticker span { color: inherit; }
/* White section links */
.nap-white-section a { color: inherit; }
img { max-width: 100%; display: block; }
/* Export fidelity: DO NOT scale. Keep 1:1 typography and layout. */
.nap-export-wrap { width: 100%; display: flex; justify-content: center; }
.nap-shell {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 14px 40px rgba(0,0,0,0.10);
}
[contenteditable] { outline: none !important; }
[data-editor-ui], [data-dnd-dragging] { display: none !important; }

@keyframes nap_ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes nap_pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
.nap-ticker-track { display: flex; white-space: nowrap; will-change: transform; }

@media (max-width: 680px) {
  .nap-2col, .nap-3col, .nap-5col { display: block !important; }
  .nap-2col > *, .nap-3col > *, .nap-5col > * { margin-bottom: 14px; }
}

.nap-tpl-prompt { display: none; padding: 10px 14px; }
.nap-tpl-prompt.open { display: block; }
.nap-copy-btn { cursor: pointer; color: #fff !important; }
.nap-expand-btn { cursor: pointer; }
/* Export should NOT truncate RSS: show all items without an internal scroll box. */
.nap-rss-scroll { max-height: none !important; overflow: visible !important; }
/* Safety: enforce SBAR letter styling even if something external tries to override. */
.nap-sbar-letter { font-size:56px !important; font-weight:400 !important; line-height:1 !important; margin-bottom:6px !important; font-style:italic !important; text-transform:uppercase !important; }

/* Export-only: ensure "Related" chips render as clear pills even if imported CSS has aggressive !important rules. */
.ai-related-label { font-weight: 700 !important; }
.ai-related-pill {
  display: inline-block !important;
  background: #F3F6FF !important;
  border: 1px solid var(--c-border) !important;
  color: var(--c-text) !important;
  padding: 4px 10px !important;
  border-radius: 999px !important;
  font-family: var(--f-mono) !important;
  font-size: 11px !important;
  line-height: 16px !important;
  margin: 0 6px 0 0 !important;
}
`;
}

// ─── Individual block renderers matching AllBlocks.tsx exactly ────────────────

function renderHeader(b: any, t: Newsletter['theme']): string {
  const bg = b.backgroundStyle === 'solid'
    ? t.primary
    : `linear-gradient(135deg, ${t.primary} 0%, ${t.secondary} 60%, ${t.accent}44 100%)`;
  return `
<div class="nap-white-section" style="background:${bg};padding:48px 40px;text-align:center;position:relative;overflow:hidden;color:#fff">
  <svg style="position:absolute;bottom:0;left:0;right:0;opacity:0.08" viewBox="0 0 800 60" fill="none" preserveAspectRatio="none" height="60">
    <path d="M0 40 Q200 0 400 30 Q600 60 800 20 L800 60 L0 60Z" fill="white"/>
  </svg>
  ${(b.logoDataUrl || b.logoUrl) ? `<div style="margin-bottom:20px"><img src="${esc(b.logoDataUrl || b.logoUrl)}" alt="Logo" style="max-height:60px;max-width:240px;border-radius:8px;display:inline-block;margin:0 auto"></div>` : ''}
  <div style="font-family:${t.fontMono};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:12px">${esc(b.issueNumber)} · ${esc(b.issueDate)}</div>
  <h1 style="font-family:${t.fontDisplay};font-size:46px;font-weight:400;color:#fff;margin:0 0 10px;letter-spacing:-0.02em;line-height:1.1">${esc(b.title)}</h1>
  <p style="font-family:${t.fontDisplay};font-size:20px;font-style:italic;color:rgba(255,255,255,0.92);margin:0 0 18px;line-height:1.3">${esc(b.subtitle)}</p>
  <div style="height:1px;background:rgba(255,255,255,0.3);max-width:280px;margin:0 auto 18px"></div>
  <p style="font-family:${t.fontBody};font-size:13px;color:rgba(255,255,255,0.85);margin:0;letter-spacing:0.02em">${esc(b.tagline)}</p>
</div>`;
}

function renderTicker(b: any, t: Newsletter['theme']): string {
  const dur = ({ slow: 60, medium: 36, fast: 20 } as any)[b.speed] ?? 36;
  const textColor = b.textColor || '#ffffff';
  const bg = b.backgroundColor || t.primary;
  const accentDot = `<span style="width:5px;height:5px;border-radius:50%;background:${t.accent};display:inline-block;flex-shrink:0"></span>`;
  const itemStyle = `font-family:${t.fontMono};font-size:12px;color:${textColor};padding:0 32px;letter-spacing:0.04em;display:inline-flex;align-items:center;gap:10px;text-decoration:none`;

  let seedHtml = '';
  if (b.sourceMode === 'rss' || b.useLinks) {
    seedHtml = (b.links || []).filter((x: any) => x?.text).map((x: any) =>
      `<a class="nap-ticker-item" href="${esc(x.url || '#')}" target="_blank" rel="noopener noreferrer" style="${itemStyle}">${accentDot}${esc(x.text)}<span style="font-size:10px;opacity:0.6;color:${textColor}">↗</span></a>`
    ).join('');
  } else {
    seedHtml = (b.items || []).map((item: string) =>
      `<span class="nap-ticker-item" style="${itemStyle}">${accentDot}${esc(item)}</span>`
    ).join('');
  }

  const dataRss = esc(JSON.stringify((b.rssUrls || []).filter(Boolean)));

  // Export RSS selector (snapshot-first; optional live refresh)
  const cfgUi = (b.sourceMode === 'rss') ? `
  <details class="nap-rss-config" data-rss-kind="ticker" style="position:relative;z-index:2;margin-left:auto;margin-right:14px">
    <summary style="list-style:none;cursor:pointer;font-family:${t.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.85);padding:6px 10px;border:1px solid rgba(255,255,255,0.25);border-radius:999px;user-select:none">RSS ▾</summary>
    <div style="margin-top:10px;background:rgba(0,0,0,0.35);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:12px;min-width:280px">
      <div style="font-family:${t.fontBody};font-size:12px;color:#fff;margin-bottom:10px;line-height:1.4">Snapshot is shown by default. Enable <b>Live</b> to refresh from selected feeds.</div>
      <label style="display:flex;align-items:center;gap:8px;font-family:${t.fontBody};font-size:12px;color:#fff;margin-bottom:10px">
        <input type="checkbox" class="nap-rss-live" style="transform:translateY(1px)" /> Live RSS
      </label>
      <div class="nap-rss-preset-list" style="display:grid;gap:6px"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <input class="nap-rss-add" placeholder="Add RSS URL" style="flex:1;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.08);color:#fff;font-family:${t.fontBody};font-size:12px" />
        <button class="nap-rss-add-btn" type="button" style="padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.12);color:#fff;font-family:${t.fontBody};font-size:12px;cursor:pointer">Add</button>
      </div>
      <div class="nap-rss-status" style="margin-top:10px;font-family:${t.fontBody};font-size:12px;color:rgba(255,255,255,0.85)"></div>
    </div>
  </details>` : '';

  return `
<div class="nap-ticker"
  data-source="${esc(b.sourceMode || 'manual')}"
  data-rss='${dataRss}'
  data-rss-max="${esc(String(b.rssMaxItems || 20))}"
  data-live="0"
  data-key="${esc(b.id || 'ticker')}"
  style="background:${bg};overflow:hidden;height:40px;display:flex;align-items:center;color:${textColor}">
  ${cfgUi}
  <div class="nap-ticker-track" style="animation:nap_ticker ${dur}s linear infinite">
    ${seedHtml}${seedHtml}
  </div>
</div>`;
}

function renderSectionDivider(b: any, t: Newsletter['theme']): string {
  if (b.style === 'bold') {
    return `
<div class="nap-white-section" style="background:${t.primary};padding:18px 40px;display:flex;align-items:center;gap:16px;color:#fff">
  ${b.number > 0 ? `<span style="font-family:${t.fontMono};font-size:32px;font-weight:300;color:rgba(255,255,255,0.25);line-height:1">${esc(String(b.number).padStart(2, '0'))}</span>` : ''}
  <div>
    <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:2px">Section</div>
    <div style="font-family:${t.fontDisplay};font-size:22px;color:#fff;line-height:1.15">${esc(b.label)}</div>
  </div>
</div>`;
  }
  return `
<div style="padding:32px 40px 16px">
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:${b.description ? 10 : 0}px">
    <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${t.muted};white-space:nowrap">
      <span>${b.number > 0 ? `0${b.number} —— ` : '—— '}</span>${esc(b.label)}<span> ——</span>
    </div>
    <div style="flex:1;height:1px;background:linear-gradient(90deg, ${t.border}, transparent)"></div>
  </div>
  ${b.description ? `<p style="font-family:${t.fontBody};font-size:14px;color:${t.muted};margin:0;line-height:1.6">${esc(b.description)}</p>` : ''}
</div>`;
}

function renderArticleGrid(b: any, t: Newsletter['theme']): string {
  const cols = b.columns || 2;
  const layout = b.layout || 'default';
  const evidenceColors: Record<string, string> = {
    High: '#00A651', Moderate: '#F47920', Low: '#C0392B', 'Expert Opinion': '#7B2D8B',
  };

  const cards = (b.articles || []).map((art: any) => {
    const ec = art.evidenceLevel ? evidenceColors[art.evidenceLevel] : null;
    const titleHtml = art.url
      ? `<a href="${esc(art.url)}" target="_blank" rel="noopener noreferrer" style="color:${t.text};text-decoration:none">${esc(art.title)}</a>`
      : esc(art.title);
    return `
<div style="border:1px solid ${t.border};border-radius:12px;overflow:hidden;background:${t.surface};display:flex;flex-direction:column">
  ${art.imageUrl ? `<div style="height:160px;overflow:hidden;flex-shrink:0"><img src="${esc(art.imageUrl)}" alt="${esc(art.title)}" style="width:100%;height:100%;object-fit:cover"></div>` : ''}
  <div style="padding:${layout === 'compact' ? '10px 14px' : '16px'};flex:1;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
      <span style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${t.muted}">${esc(art.source || '')}</span>
      ${ec ? `<span style="background:${ec}22;color:${ec};border:1px solid ${ec}44;border-radius:999px;padding:2px 8px;font-family:${t.fontMono};font-size:10px;font-weight:600">${esc(art.evidenceLevel)}</span>` : ''}
    </div>
    <h3 style="font-family:${t.fontDisplay};font-size:${layout === 'compact' ? 16 : 20}px;color:${t.text};margin:0 0 10px;line-height:1.25;font-weight:400">${titleHtml}</h3>
    ${!layout.includes('compact') && art.summary ? `<p style="font-family:${t.fontBody};font-size:13px;color:${t.muted};margin:0 0 12px;line-height:1.6;flex:1">${esc(art.summary)}</p>` : ''}
    ${art.clinicalContext ? `
    <div style="background:${t.background};border-radius:8px;padding:10px 12px;margin-bottom:10px">
      <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${t.muted};margin-bottom:4px">Clinical Context</div>
      <p style="font-family:${t.fontBody};font-size:13px;color:${t.text};margin:0;line-height:1.55">${esc(art.clinicalContext)}</p>
    </div>` : ''}
    ${art.myTake ? `<p style="font-family:${t.fontBody};font-size:13px;color:${t.secondary};font-style:italic;margin:0 0 12px;border-left:3px solid ${t.accent};padding-left:10px;line-height:1.5">${esc(art.myTake)}</p>` : ''}
    ${art.url ? `<a href="${esc(art.url)}" target="_blank" rel="noopener noreferrer" style="margin-top:auto;display:inline-flex;align-items:center;gap:5px;font-family:${t.fontBody};font-size:12px;color:${t.accent};font-weight:600;text-decoration:none">Read full paper <span style="font-size:14px">→</span></a>` : ''}
  </div>
</div>`;
  }).join('');

  return `
<div style="padding:24px 40px">
  ${b.sectionTitle ? `<h2 style="font-family:${t.fontDisplay};font-size:26px;color:${t.text};margin:0 0 20px;font-weight:400">${esc(b.sectionTitle)}</h2>` : ''}
  <div class="nap-${cols}col" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:20px">${cards}</div>
</div>`;
}

function renderSpotlight(b: any, t: Newsletter['theme']): string {
  const art = b.article || {};
  const accent = b.accentColor || t.accent;
  const isTop = b.layout === 'top-image';
  const isLeft = b.layout === 'left-image';
  const hasImage = !!art.imageUrl;

  const titleHtml = art.url
    ? `<a href="${esc(art.url)}" target="_blank" rel="noopener noreferrer" style="color:${t.text};text-decoration:none">${esc(art.title)}</a>`
    : esc(art.title);
  const readBtn = art.url
    ? `<a href="${esc(art.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;background:${accent};color:#fff;border-radius:8px;font-family:${t.fontBody};font-size:13px;font-weight:600;text-decoration:none">Read the paper →</a>`
    : '';

  const inner = `
    <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${t.muted};margin-bottom:12px">✦ Spotlight · ${esc(art.source || '')}</div>
    <h2 style="font-family:${t.fontDisplay};font-size:28px;color:${t.text};margin:0 0 12px;font-weight:400;line-height:1.2">${titleHtml}</h2>
    ${art.summary ? `<p style="font-family:${t.fontBody};font-size:15px;color:${t.muted};margin:0 0 16px;line-height:1.65">${esc(art.summary)}</p>` : ''}
    ${art.clinicalContext ? `
    <div style="background:${t.background};border-radius:10px;padding:14px 16px;margin-bottom:14px">
      <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${t.muted};margin-bottom:6px">Clinical Context</div>
      <p style="font-family:${t.fontBody};font-size:14px;color:${t.text};margin:0;line-height:1.6">${esc(art.clinicalContext)}</p>
    </div>` : ''}
    ${art.myTake ? `<p style="font-family:${t.fontBody};font-size:14px;font-style:italic;color:${t.secondary};margin:0 0 16px;border-left:3px solid ${accent};padding-left:12px;line-height:1.6">${esc(art.myTake)}</p>` : ''}
    ${readBtn}`;

  if (isTop && hasImage) {
    return `
<div style="padding:24px 40px">
  <div style="border:1px solid ${t.border};border-radius:14px;overflow:hidden;background:${t.surface}">
    <img src="${esc(art.imageUrl)}" alt="${esc(art.title || '')}" style="width:100%;height:280px;object-fit:cover">
    <div style="padding:24px">${inner}</div>
  </div>
</div>`;
  }
  const imgHtml = hasImage ? `<div style="width:40%;flex-shrink:0"><img src="${esc(art.imageUrl)}" alt="${esc(art.title || '')}" style="width:100%;height:100%;object-fit:cover;display:block"></div>` : '';
  const flexDir = hasImage ? (isLeft ? 'row' : 'row-reverse') : 'column';
  const bl = hasImage && isLeft ? `border-left:4px solid ${accent};` : '';
  return `
<div style="padding:24px 40px">
  <div style="border:1px solid ${t.border};border-radius:14px;overflow:hidden;background:${t.surface};display:flex;flex-direction:${flexDir}">
    ${imgHtml}
    <div style="flex:1;padding:28px;${bl}">${inner}</div>
  </div>
</div>`;
}

function renderEthicsSplit(b: any, t: Newsletter['theme']): string {
  const sourceLink = b.source
    ? (b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer" style="color:${t.accent}">${esc(b.source)}</a>` : esc(b.source))
    : '';
  return `
<div style="padding:28px 40px">
  <div style="margin-bottom:20px">
    <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${t.accent};margin-bottom:6px">⚖ AI Ethics &amp; Governance</div>
    <h2 style="font-family:${t.fontDisplay};font-size:26px;color:${t.text};margin:0 0 6px;font-weight:400">${esc(b.heading || '')}</h2>
    <p style="font-family:${t.fontBody};font-size:14px;color:${t.muted};margin:0">${esc(b.subheading || '')}</p>
    ${b.source !== undefined ? `<div style="font-family:${t.fontMono};font-size:11px;color:${t.muted};margin-top:6px">Source: ${sourceLink}</div>` : ''}
  </div>
  <div class="nap-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px">
    <div style="border:1px solid ${t.border};border-radius:12px;padding:20px;background:${t.background}">
      <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C0392B;font-weight:700;margin-bottom:10px">${esc(b.leftTitle || '')}</div>
      <p style="font-family:${t.fontBody};font-size:14px;color:${t.text};margin:0;line-height:1.65">${esc(b.leftContent || '')}</p>
    </div>
    <div style="border:1px solid ${t.accent}44;border-radius:12px;padding:20px;background:${t.accent}0A">
      <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};font-weight:700;margin-bottom:10px">${esc(b.rightTitle || '')}</div>
      <p style="font-family:${t.fontBody};font-size:14px;color:${t.text};margin:0;line-height:1.65">${esc(b.rightContent || '')}</p>
    </div>
  </div>
  <div style="padding:14px 18px;border:1px solid ${t.border};border-radius:12px;border-left:4px solid ${t.accent}">
    <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${t.muted};margin-bottom:6px">Clinical Perspective</div>
    <p style="font-family:${t.fontBody};font-size:14px;color:${t.text};margin:0;line-height:1.65">${esc(b.clinicalPerspective || '')}</p>
  </div>
</div>`;
}

function renderImage(b: any, _t: Newsletter['theme']): string {
  const src = b.dataUrl || b.url;
  if (!src) return '';
  const widthMap: Record<string, string> = { full: '100%', wide: '80%', medium: '60%', small: '40%' };
  const maxW = widthMap[b.width] || '100%';
  const imgTag = `<img src="${esc(src)}" alt="${esc(b.alt || '')}" style="max-width:${maxW};border-radius:${Number(b.borderRadius ?? 12)}px;display:inline-block">`;
  return `
<div style="padding:16px 40px;text-align:${esc(b.alignment || 'center')}">
  ${b.linkUrl ? `<a href="${esc(b.linkUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;max-width:${maxW}">${imgTag}</a>` : imgTag}
  ${b.caption ? `<p style="font-family:${_t.fontBody};font-size:12px;color:${_t.muted};margin:8px 0 0;text-align:center">${esc(b.caption)}</p>` : ''}
</div>`;
}

function renderText(b: any, t: Newsletter['theme']): string {
  const maxWidthMap: Record<string, string> = { full: '100%', reading: '720px', narrow: '560px' };
  return `
<div style="padding:16px 40px">
  <div style="font-family:${t.fontBody};color:${t.text};line-height:1.7;max-width:${maxWidthMap[b.maxWidth] || '100%'};margin:0 auto;text-align:${esc(b.alignment || 'left')};font-size:15px">
    ${b.html || ''}
  </div>
</div>`;
}

function renderHtmlEmbed(b: any, t: Newsletter['theme']): string {
  return `
<div style="padding:16px 40px">
  ${b.label ? `<div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${t.muted};margin-bottom:8px">💻 ${esc(b.label)}</div>` : ''}
  <div>${b.html || ''}</div>
</div>`;
}

function renderPromptMasterclass(b: any, t: Newsletter['theme']): string {
  return `
<div style="padding:28px 40px">
  <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${t.accent};margin-bottom:8px">🤖 Prompt Like a Rockstar</div>
  <h2 style="font-family:${t.fontDisplay};font-size:26px;color:${t.text};margin:0 0 6px;font-weight:400">${esc(b.heading || '')}</h2>
  <div style="font-family:${t.fontBody};font-size:14px;color:${t.muted};margin-bottom:20px">${esc(b.step || '')} · Framework: <strong>${esc(b.framework || '')}</strong></div>
  <div class="nap-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px">
    <div style="border:1px solid #f5c6c0;border-radius:12px;padding:16px;background:#FEF0EE">
      <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C0392B;margin-bottom:8px">❌ Bad Prompt</div>
      <p style="font-family:${t.fontBody};font-size:14px;font-style:italic;color:#7A1E12;margin:0;line-height:1.55">${esc(b.badPrompt || '')}</p>
    </div>
    <div style="border:1px solid ${t.accent}44;border-radius:12px;padding:16px;background:${t.accent}0D">
      <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:8px">✓ Good Prompt</div>
      <p style="font-family:${t.fontBody};font-size:14px;color:${t.text};margin:0;line-height:1.55">${esc(b.goodPrompt || '')}</p>
    </div>
  </div>
  <div style="padding:12px 16px;background:${t.background};border-radius:10px;border-left:3px solid ${t.accent}">
    <p style="font-family:${t.fontBody};font-size:13px;color:${t.muted};margin:0;line-height:1.6"><strong>Why this matters:</strong> ${esc(b.explanation || '')}</p>
  </div>
</div>`;
}

function renderSbarPrompt(b: any, t: Newsletter['theme']): string {
  const colors = [t.primary, t.secondary, t.accent, '#7B2D8B', '#00A651'];
  const stepsHtml = (b.steps || []).map((step: any, i: number) => {
    const c = colors[i] || t.primary;
    return `
<div style="border:1px solid ${t.border};border-radius:10px;padding:14px;background:${t.surface}">
  <div class="nap-sbar-letter" style="font-family:${t.fontDisplay};color:${c};">${esc((step.letter || '').toUpperCase())}</div>
  <div style="font-family:${t.fontMono};font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${t.muted};margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid ${c}">${esc(step.name || '')}</div>
  <p style="font-family:${t.fontBody};font-size:12px;color:${t.text};margin:0 0 10px;line-height:1.5">${esc(step.description || '')}</p>
  <div style="background:${t.background};border-radius:6px;padding:8px 10px;border-left:3px solid ${c}">
    <p style="font-family:${t.fontBody};font-size:11px;color:${t.muted};margin:0;font-style:italic;line-height:1.45">${esc(step.example || '')}</p>
  </div>
</div>`;
  }).join('');

  return `
<div style="padding:28px 40px">
  <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${t.accent};margin-bottom:8px">📋 Clinical AI Prompting</div>
  <h2 style="font-family:${t.fontDisplay};font-size:26px;color:${t.text};margin:0 0 20px;font-weight:400">${esc(b.heading || '')}</h2>
  <div class="nap-5col" style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">${stepsHtml}</div>
</div>`;
}

function renderPromptTemplate(b: any, t: Newsletter['theme']): string {
  const prompt = String(b.prompt || '');
  const heading = String(b.heading || 'Template Prompt');
  // Collapsible so it doesn't dominate the layout.
  return `
<div style="padding:18px 40px">
  <details style="border:1px solid ${t.border};border-radius:12px;overflow:hidden;background:${t.surface}">
    <summary style="list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;user-select:none">
      <div style="display:flex;flex-direction:column;gap:2px">
        <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${t.accent}">🧩 Template Prompt</div>
        <div style="font-family:${t.fontDisplay};font-size:18px;color:${t.text};font-weight:500">${esc(heading)}</div>
      </div>
      <button class="nap-copy-btn" data-copy="${esc(prompt)}" style="padding:7px 12px;background:${t.primary};border:none;border-radius:8px;font-family:${t.fontBody};font-size:12px;color:#fff;cursor:pointer;white-space:nowrap">📋 Copy</button>
    </summary>
    <div style="padding:12px 14px;background:${t.background};border-top:1px solid ${t.border}">
      <pre style="font-family:${t.fontMono};font-size:12px;color:${t.text};margin:0;white-space:pre-wrap;line-height:1.6">${esc(prompt)}</pre>
    </div>
  </details>
</div>`;
}

function renderSafetyReminders(b: any, t: Newsletter['theme']): string {
  const items = (b.items || []).filter(Boolean);
  if (!items.length) return '';
  const gridCols = items.length <= 2 ? '1fr' : '1fr 1fr';
  return `
<div style="padding:10px 40px 18px">
  <div style="background:#FFF7E6;border:1px solid #F4D38B;border-radius:12px;padding:14px">
    <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8A5A00;margin-bottom:10px">⚠️ ${esc(b.heading || 'Safety Reminders')}</div>
    <div style="display:grid;grid-template-columns:${gridCols};gap:10px">
      ${items.map((txt: string) => `
        <div style="background:rgba(255,255,255,0.65);border:1px solid ${t.border};border-radius:10px;padding:12px;display:flex;gap:10px">
          <div style="font-family:${t.fontMono};font-size:11px;color:#8A5A00;margin-top:1px">▶</div>
          <div style="font-family:${t.fontBody};font-size:13px;color:${t.text};line-height:1.6">${esc(txt)}</div>
        </div>`).join('')}
    </div>
  </div>
</div>`;
}

function renderClinicalPromptTemplates(b: any, t: Newsletter['theme']): string {
  const categoryColors: Record<string, string> = {
    'Differential Diagnosis': t.primary, 'Discharge Summary': t.secondary,
    'Literature Review': t.accent, 'Patient Education': '#00A651',
    'EEG / EMG Report': '#7B2D8B', 'Research': '#F47920',
  };
  const templatesHtml = (b.templates || []).map((tpl: any) => {
    const catColor = categoryColors[tpl.category] || t.primary;
    const tplId = `tpl-${esc(String(tpl.id || Math.random().toString(36).slice(2)))}`;
    return `
<div style="border:1px solid ${t.border};border-radius:10px;overflow:hidden;background:${t.surface}">
  <div style="padding:12px 14px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="font-family:${t.fontMono};font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#fff;padding:2px 7px;background:${catColor};border-radius:999px">${esc(tpl.category)}</span>
        </div>
        <div style="font-family:${t.fontBody};font-size:13px;font-weight:600;color:${t.text};margin-bottom:3px">${esc(tpl.title)}</div>
        <div style="font-family:${t.fontBody};font-size:11px;color:${t.muted}">${esc(tpl.useCase)}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="nap-expand-btn" data-target="${tplId}" style="padding:5px 8px;background:none;border:1px solid ${t.border};border-radius:6px;font-family:${t.fontBody};font-size:11px;color:${t.muted}">Preview</button>
        <button class="nap-copy-btn" data-copy="${esc(tpl.prompt)}" style="padding:5px 10px;background:${t.primary};border:none;border-radius:6px;font-family:${t.fontBody};font-size:11px;color:#fff">📋 Copy</button>
      </div>
    </div>
  </div>
  <div id="${tplId}" class="nap-tpl-prompt" style="background:${t.background}">
    <pre style="font-family:${t.fontMono};font-size:11px;color:${t.text};margin:0;white-space:pre-wrap;line-height:1.6">${esc(tpl.prompt)}</pre>
  </div>
</div>`;
  }).join('');

  return `
<div style="padding:28px 40px">
  <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${t.accent};margin-bottom:8px">📎 Ready-to-Use Prompts</div>
  <h2 style="font-family:${t.fontDisplay};font-size:26px;color:${t.text};margin:0 0 6px;font-weight:400">${esc(b.heading || '')}</h2>
  <p style="font-family:${t.fontBody};font-size:14px;color:${t.muted};margin:0 0 20px">${esc(b.description || '')}</p>
  <div class="nap-2col" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">${templatesHtml}</div>
</div>`;
}

function renderTermOfMonth(b: any, t: Newsletter['theme']): string {
  const sections = [
    { title: 'Definition', content: b.definition },
    { title: 'Relevance to Medicine', content: b.relevance },
    { title: 'Neurology Application', content: b.neurologyApplication },
  ];
  return `
<div style="padding:28px 40px">
  <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${t.accent};margin-bottom:8px">📖 AI Term of the Month</div>
  <h2 style="font-family:${t.fontDisplay};font-size:34px;color:${t.text};margin:0 0 20px;font-weight:400">${esc(b.term || '')}</h2>
  <div class="nap-3col" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    ${sections.map(s => `
    <div style="border:1px solid ${t.border};border-radius:10px;padding:16px;background:${t.surface}">
      <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${t.muted};margin-bottom:8px">${esc(s.title)}</div>
      <p style="font-family:${t.fontBody};font-size:13px;color:${t.text};margin:0;line-height:1.6">${esc(s.content || '')}</p>
    </div>`).join('')}
  </div>
  ${(b.relatedTerms || []).length ? `
  <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">
    <strong class="ai-related-label" style="font-family:${t.fontBody};font-size:13px;color:${t.text};font-weight:700">Related:</strong>
    ${normalizeTerms(b.relatedTerms).map((term: string) => `<span class="ai-related-pill" style="display:inline-block !important;font-family:${t.fontMono} !important;font-size:11px !important;padding:4px 10px !important;background:#F3F6FF !important;border:1px solid ${t.border} !important;border-radius:999px !important;color:${t.text} !important;line-height:16px !important">${esc(term)}</span>`).join('')}
  </div>` : ''}
</div>`;
}

function renderAiCaseFile(b: any, t: Newsletter['theme']): string {
  const imgSrc = b.imageDataUrl || b.imageUrl;
  return `
<div style="padding:28px 40px">
  <div style="display:flex;gap:24px;align-items:flex-start">
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0">
      <div style="background:${t.primary};border-radius:10px;padding:14px 18px;text-align:center;color:#fff !important">
        <div style="font-family:${t.fontDisplay};font-size:28px;color:#fff !important;line-height:1;text-shadow:0 1px 0 rgba(0,0,0,0.18)">${esc(b.year || '')}</div>
        <div style="font-family:${t.fontMono};font-size:10px;color:rgba(255,255,255,0.92) !important;letter-spacing:0.12em;text-transform:uppercase;margin-top:4px;text-shadow:0 1px 0 rgba(0,0,0,0.12)">AI Case File</div>
      </div>
      ${imgSrc ? `<div style="width:100px;height:80px;border-radius:8px;overflow:hidden;border:1px solid ${t.border}"><img src="${esc(imgSrc)}" alt="${esc(b.title || '')}" style="width:100%;height:100%;object-fit:cover"></div>` : ''}
    </div>
    <div style="flex:1">
      <h3 style="font-family:${t.fontDisplay};font-size:22px;color:${t.text};margin:0 0 10px;font-weight:400">${esc(b.title || '')}</h3>
      <p style="font-family:${t.fontBody};font-size:14px;color:${t.muted};margin:0 0 12px;line-height:1.65">${esc(b.content || '')}</p>
      ${b.significance ? `<div style="background:${t.background};border-radius:8px;padding:10px 14px;border-left:3px solid ${t.accent};margin-bottom:12px"><p style="font-family:${t.fontBody};font-size:13px;color:${t.muted};margin:0;line-height:1.55"><strong>Significance:</strong> ${esc(b.significance)}</p></div>` : ''}
      ${(b.sourceUrl || b.sourceLabel) ? `<div style="font-family:${t.fontMono};font-size:11px;color:${t.muted}">Source: ${b.sourceUrl ? `<a href="${esc(b.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="color:${t.accent}">${esc(b.sourceLabel || b.sourceUrl)}</a>` : esc(b.sourceLabel)}</div>` : ''}
    </div>
  </div>
</div>`;
}

function renderQuickHits(b: any, t: Newsletter['theme']): string {
  const hits = (b.hits || []).map((hit: any, i: number) => {
    const titleHtml = hit.url
      ? `<a href="${esc(hit.url)}" target="_blank" rel="noopener noreferrer" style="color:${t.text};text-decoration:none">${esc(hit.title || '')}</a>`
      : esc(hit.title || '');
    return `
<div style="display:flex;gap:14px;align-items:flex-start;padding:12px 14px;border:1px solid ${t.border};border-radius:10px;background:${t.surface}">
  <span style="font-family:${t.fontMono};font-size:18px;color:${t.accent};line-height:1;flex-shrink:0;min-width:28px">${String(i + 1).padStart(2, '0')}</span>
  <div style="flex:1">
    <div style="font-family:${t.fontBody};font-size:14px;font-weight:600;color:${t.text};margin-bottom:4px;line-height:1.3">${titleHtml}</div>
    <div style="font-family:${t.fontMono};font-size:10px;color:${t.muted};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">${esc(hit.source || '')}</div>
    ${hit.summary ? `<p style="font-family:${t.fontBody};font-size:13px;color:${t.muted};margin:0;line-height:1.5">${esc(hit.summary)}</p>` : ''}
  </div>
  ${hit.url ? `<a href="${esc(hit.url)}" target="_blank" rel="noopener noreferrer" style="flex-shrink:0;font-family:${t.fontBody};font-size:11px;color:${t.accent};font-weight:600;text-decoration:none">Read →</a>` : ''}
</div>`;
  }).join('');
  return `
<div style="padding:24px 40px">
  <h2 style="font-family:${t.fontDisplay};font-size:26px;color:${t.text};margin:0 0 16px;font-weight:400">⚡ ${esc(b.heading || '')}</h2>
  <div style="display:flex;flex-direction:column;gap:10px">${hits}</div>
</div>`;
}

function renderHumor(b: any, t: Newsletter['theme']): string {
  const imgSrc = b.imageDataUrl || b.imageUrl;
  const imgFit = b.imageFit || 'contain';
  const imgHeight = b.imageHeight;
  const imgStyle = imgHeight
    ? `width:100%;height:${imgHeight}px;object-fit:${imgFit};display:block`
    : `width:100%;height:auto;display:block`;
  return `
<div style="padding:28px 40px">
  <div style="background:linear-gradient(135deg,${t.background},${t.surface});border:1px solid ${t.border};border-radius:16px;overflow:hidden">
    <div style="padding:16px 18px;border-bottom:1px solid ${t.border};display:flex;align-items:center;gap:10px">
      <span style="font-size:18px">😄</span>
      <div style="font-family:${t.fontDisplay};font-size:20px;color:${t.text};font-weight:400">${esc(b.heading || 'Humor')}</div>
    </div>
    ${imgSrc ? `<img src="${esc(imgSrc)}" alt="" style="${imgStyle}">` : ''}
    <div style="padding:18px 22px;text-align:center">
      ${!imgSrc ? `<div style="font-size:44px;margin-bottom:10px">${esc(b.emojiDecor || '😄')}</div>` : ''}
      ${b.attribution ? `<div style="font-family:${t.fontBody};font-size:14px;color:${t.muted};margin-bottom:10px">${esc(b.attribution)}</div>` : ''}
      <div style="font-family:${t.fontBody};font-size:16px;color:${t.text};font-style:italic;line-height:1.65;max-width:760px;margin:0 auto">${esc(b.content || '')}</div>
      ${b.sourceUrl ? `<div style="margin-top:10px"><a href="${esc(b.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="font-family:${t.fontBody};font-size:12px;color:${t.accent};text-decoration:none">Source ↗</a></div>` : ''}
    </div>
  </div>
</div>`;
}

function renderSpacer(b: any, t: Newsletter['theme']): string {
  return `<div style="height:${Number(b.height || 24)}px;${b.showLine ? `border-top:1px ${esc(b.lineStyle || 'solid')} ${t.border};margin:0 40px` : ''}"></div>`;
}

function renderAiSafety(b: any, t: Newsletter['theme']): string {
  type SevKey = 'critical' | 'high' | 'medium' | 'informational';
  const severityConfig: Record<SevKey, { color: string; bg: string; border: string; label: string; icon: string }> = {
    critical:      { color: '#C0392B', bg: '#FEF0EE', border: '#f5c6c0', label: 'CRITICAL', icon: '🔴' },
    high:          { color: '#C06500', bg: '#FFF4E6', border: '#F6D860', label: 'HIGH',     icon: '🟠' },
    medium:        { color: '#0057A8', bg: '#EEF4FF', border: '#C8D9EE', label: 'MEDIUM',   icon: '🔵' },
    informational: { color: '#005F6B', bg: '#F0FAFA', border: '#B2E0E4', label: 'INFO',     icon: '⚪' },
  };
  const updatesHtml = (b.updates || []).map((u: any) => {
    const sev = severityConfig[(u.severity as SevKey)] || severityConfig.informational;
    const titleHtml = u.url
      ? `<a href="${esc(u.url)}" target="_blank" rel="noopener noreferrer" style="color:${t.text};text-decoration:none">${esc(u.title || '')}</a>`
      : esc(u.title || '');
    return `
<div style="border:1px solid ${sev.border};border-radius:10px;background:${sev.bg}">
  <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px">
    <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:2px">
      <span style="font-size:14px">${sev.icon}</span>
      <span style="font-family:${t.fontMono};font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:${sev.color};font-weight:700">${sev.label}</span>
    </div>
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
        <span style="font-family:${t.fontMono};font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:${sev.color};padding:2px 7px;background:${sev.color}18;border-radius:999px">${esc(u.category || '')}</span>
        <span style="font-family:${t.fontMono};font-size:10px;color:${t.muted}">${esc(u.date || '')}</span>
      </div>
      <div style="font-family:${t.fontBody};font-size:14px;font-weight:600;color:${t.text};margin-bottom:4px">${titleHtml}</div>
      <p style="font-family:${t.fontBody};font-size:13px;color:${t.muted};margin:0;line-height:1.55">${esc(u.summary || '')}</p>
      ${u.url ? `<a href="${esc(u.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-family:${t.fontBody};font-size:11px;color:${sev.color};font-weight:600">View full guidance →</a>` : ''}
    </div>
  </div>
</div>`;
  }).join('');

  return `
<div style="padding:28px 40px">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:18px">🛡️</span>
        <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#C0392B">AI Safety Monitor</div>
      </div>
      <h2 style="font-family:${t.fontDisplay};font-size:26px;color:${t.text};margin:0 0 4px;font-weight:400">${esc(b.heading || '')}</h2>
      <p style="font-family:${t.fontBody};font-size:14px;color:${t.muted};margin:0">${esc(b.subheading || '')}</p>
    </div>
    ${b.showLastUpdated ? `<div style="font-family:${t.fontMono};font-size:10px;color:${t.muted};text-align:right;line-height:1.4">Last updated<br>${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>` : ''}
  </div>
  <div style="display:flex;flex-direction:column;gap:12px">${updatesHtml}</div>
</div>`;
}

function renderNorthwellSpotlight(b: any, t: Newsletter['theme']): string {
  const items = (b.items || []).slice(0, b.maxItems || 6).map((item: any) => `
<div style="border:1px solid ${t.border};border-radius:10px;overflow:hidden;background:${t.surface};display:flex;flex-direction:column">
  ${item.imageUrl ? `<div style="height:120px;overflow:hidden"><img src="${esc(item.imageUrl)}" alt="${esc(item.title)}" style="width:100%;height:100%;object-fit:cover"></div>` : ''}
  <div style="padding:14px;flex:1;display:flex;flex-direction:column">
    ${item.category ? `<span style="font-family:${t.fontMono};font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${t.accent};margin-bottom:6px;display:block">${esc(item.category)}</span>` : ''}
    <div style="font-family:${t.fontBody};font-size:13px;font-weight:600;color:${t.text};margin-bottom:6px;line-height:1.35;flex:1">
      ${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" style="color:${t.text};text-decoration:none">${esc(item.title)}</a>` : esc(item.title)}
    </div>
    ${item.summary ? `<p style="font-family:${t.fontBody};font-size:12px;color:${t.muted};margin:0 0 8px;line-height:1.5">${esc(item.summary)}</p>` : ''}
    ${item.pubDate ? `<div style="font-family:${t.fontMono};font-size:10px;color:${t.muted}">${new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>` : ''}
    ${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" style="margin-top:8px;font-family:${t.fontBody};font-size:11px;color:${t.accent};font-weight:600;text-decoration:none">Read more →</a>` : ''}
  </div>
</div>`).join('');

  return `
<div style="padding:28px 40px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
    <div style="width:28px;height:28px;background:${t.primary};border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:14px">🏥</span></div>
    <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${t.primary}">Northwell Health</div>
  </div>
  <h2 style="font-family:${t.fontDisplay};font-size:26px;color:${t.text};margin:0 0 4px;font-weight:400">${esc(b.heading || '')}</h2>
  ${b.subheading ? `<p style="font-family:${t.fontBody};font-size:14px;color:${t.muted};margin:0 0 20px">${esc(b.subheading)}</p>` : ''}
  <div class="nap-3col" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${items}</div>
</div>`;
}

function renderRssSidebar(b: any, t: Newsletter['theme']): string {
  const urls = (b.feedUrls || []).filter(Boolean);
  const dataFeeds = esc(JSON.stringify(urls));
  // IMPORTANT: do not derive export max from the last cached items length.
  // That causes exports to "cap" at whatever happened to be cached (often 5).
  const max = (typeof b.maxItems === 'number' ? b.maxItems : 10);
  const safeMax = Math.min(50, Math.max(1, max));
  const itemsHtml = (b.items || []).slice(0, safeMax).map((item: any, i: number) => `
<div style="padding:11px 18px;border-bottom:1px solid ${t.border};display:flex;gap:10px;align-items:flex-start">
  <span style="font-family:${t.fontMono};font-size:12px;color:${t.accent};flex-shrink:0;min-width:20px;margin-top:1px">${String(i + 1).padStart(2, '0')}</span>
  <div style="flex:1">
    <div style="font-family:${t.fontBody};font-size:13px;font-weight:600;color:${t.text};line-height:1.3;margin-bottom:3px">
      ${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" style="color:${t.text};text-decoration:none">${esc(item.title || '')}</a>` : esc(item.title || '')}
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      ${item.source ? `<span style="font-family:${t.fontMono};font-size:9px;color:${t.muted};text-transform:uppercase;letter-spacing:0.08em">${esc(item.source)}</span>` : ''}
      ${item.pubDate ? `<span style="font-family:${t.fontMono};font-size:9px;color:${t.muted}">${new Date(item.pubDate).toLocaleDateString()}</span>` : ''}
    </div>
  </div>
  ${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" style="flex-shrink:0;font-family:${t.fontBody};font-size:11px;color:${t.accent};font-weight:600;text-decoration:none;padding-top:1px">↗</a>` : ''}
</div>`).join('');

  // Export RSS selector UI (snapshot-first; optional live refresh)
  const cfgUi = `
    <details class="nap-rss-config" data-rss-kind="sidebar" style="padding:10px 18px;border-bottom:1px solid ${t.border};background:${t.background}">
      <summary style="list-style:none;cursor:pointer;font-family:${t.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${t.muted};user-select:none">RSS sources ▾</summary>
      <div style="margin-top:10px;display:grid;gap:10px">
        <div style="font-family:${t.fontBody};font-size:12px;color:${t.text};line-height:1.45">Snapshot is shown by default. Enable <b>Live</b> to refresh from selected feeds.</div>
        <label style="display:flex;align-items:center;gap:8px;font-family:${t.fontBody};font-size:12px;color:${t.text}">
          <input type="checkbox" class="nap-rss-live" style="transform:translateY(1px)" /> Live RSS
        </label>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-family:${t.fontBody};font-size:12px;color:${t.text}">Items per feed</div>
          <select class="nap-rss-max" style="margin-left:auto;padding:6px 10px;border-radius:10px;border:1px solid ${t.border};background:${t.surface};color:${t.text};font-family:${t.fontBody};font-size:12px">
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="8">8</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
          </select>
        </div>
        <div class="nap-rss-preset-list" style="display:grid;gap:6px"></div>
        <div style="display:flex;gap:8px">
          <input class="nap-rss-add" placeholder="Add RSS URL" style="flex:1;padding:8px 10px;border-radius:10px;border:1px solid ${t.border};background:${t.surface};color:${t.text};font-family:${t.fontBody};font-size:12px" />
          <button class="nap-rss-add-btn" type="button" style="padding:8px 10px;border-radius:10px;border:1px solid ${t.border};background:${t.background};color:${t.text};font-family:${t.fontBody};font-size:12px;cursor:pointer">Add</button>
        </div>
        <div class="nap-rss-status" style="font-family:${t.fontBody};font-size:12px;color:${t.muted}"></div>
      </div>
    </details>`;

  return `
<div style="padding:24px 40px">
  <div class="nap-rss-sidebar" data-feeds='${dataFeeds}' data-max="${safeMax}" data-live="0" data-key="${esc(b.id || (b.heading || 'rss'))}" style="border:1px solid ${t.border};border-radius:12px;overflow:hidden;background:${t.surface}">
    <div style="background:${t.primary};padding:12px 18px;display:flex;align-items:center;gap:8px;color:#fff">
      <span style="font-size:14px">📰</span>
      <span style="font-family:${t.fontMono};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#fff;font-weight:600">${esc(b.heading || 'News')}</span>
      <span style="margin-left:auto;font-family:${t.fontMono};font-size:9px;color:rgba(255,255,255,0.7)" class="nap-rss-timestamp">${b.lastFetched ? `Updated ${new Date(b.lastFetched).toLocaleDateString()}` : 'Snapshot'}</span>
    </div>
    ${cfgUi}
    <div class="nap-rss-scroll">
      <div class="nap-rss-items">
        ${(itemsHtml || (!urls.length
          ? `<div style="padding:24px 18px;text-align:center;color:${t.muted};font-family:${t.fontBody};font-size:13px">No feeds configured.</div>`
          : `<div style="padding:24px 18px;text-align:center;color:${t.muted};font-family:${t.fontBody};font-size:13px">Snapshot not available yet. Enable Live to fetch.</div>`))}
      </div>
    </div>
  </div>
</div>`;
}

function renderFooter(b: any, t: Newsletter['theme']): string {
  const contactHref = `mailto:yelsherif@northwell.edu?subject=${encodeURIComponent('Neurology AI Pulse Newsletter Suggestions/Comments')}`;

  return `
<div class="nap-white-section" style="background:${t.primary};padding:44px 40px 36px;text-align:center;color:#fff">
  ${(b.nextIssueDate || b.nextIssueTeaser) ? `
  <div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:14px 20px;margin-bottom:28px;display:inline-block">
    <div style="font-family:${t.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:4px">Next Issue</div>
    <div style="font-family:${t.fontBody};font-size:14px;color:#fff">${esc(b.nextIssueDate || '')}${b.nextIssueTeaser ? ` · ${esc(b.nextIssueTeaser)}` : ''}</div>
  </div>` : ''}

  <div style="font-family:${t.fontDisplay};font-size:22px;color:#fff;margin-bottom:4px;font-weight:400">${esc(b.institution || '')}</div>
  <div style="font-family:${t.fontBody};font-size:14px;color:rgba(255,255,255,0.85);margin-bottom:4px">${esc(b.department || '')}</div>
  ${b.editors ? `<div style="font-family:${t.fontBody};font-size:13px;color:rgba(255,255,255,0.75);margin-bottom:22px">${esc(b.editors)}</div>` : ''}

  <div style="display:flex;justify-content:center;margin-bottom:22px">
    <a href="${esc(contactHref)}" style="display:inline-flex;align-items:center;gap:10px;font-family:${t.fontBody};font-size:13px;font-weight:700;color:#fff;text-decoration:none;padding:10px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.35);background:rgba(255,255,255,0.10)">
      Contact Us <span style="opacity:0.8">✉️</span>
    </a>
  </div>

  <div style="height:1px;background:rgba(255,255,255,0.18);max-width:240px;margin:0 auto 18px"></div>

  <p style="font-family:${t.fontBody};font-size:11px;color:rgba(255,255,255,0.75);margin:0 0 8px;max-width:580px;margin-left:auto;margin-right:auto;line-height:1.6">${esc(b.disclaimer || '')}</p>
  <p style="font-family:${t.fontMono};font-size:10px;color:rgba(255,255,255,0.65);margin:0;letter-spacing:0.1em">© ${esc(b.copyrightYear || '')} ${esc(b.institution || '')}</p>
</div>`;
}


// ─── Runtime script ───────────────────────────────────────────────────────────

function runtimeScript(): string {
  return `<script>
(function(){
  'use strict';
  const PROXY = 'https://api.allorigins.win/get?url=';

  // Preset RSS feeds (starter set). Users can add custom URLs.
  const PRESETS = [
    { label: 'JAMA Neurology (Online First)', url: 'https://jamanetwork.com/rss/site_16/onlineFirst_72.xml' },
    { label: 'JAMA Neurology (Current Issue)', url: 'https://jamanetwork.com/rss/site_16/72.xml' },
    { label: 'Practical Neurology (BMJ) – Current', url: 'https://pn.bmj.com/rss/current.xml' },
    { label: 'Fierce Healthcare (Health IT)', url: 'https://www.fiercehealthcare.com/rss/healthit' },
    { label: 'MIT Technology Review (AI)', url: 'https://www.technologyreview.com/feed/' },
    { label: 'arXiv (cs.AI recent)', url: 'https://export.arxiv.org/rss/cs.AI' }
  ];

  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function parseXml(xml){
    try {
      const doc = new DOMParser().parseFromString(xml,'text/xml');
      if(doc.querySelector('parsererror')) return [];
      const items = Array.from(doc.querySelectorAll('item'));
      if(items.length) return items.map(el=>({
        title:(el.querySelector('title')?.textContent||'').trim(),
        url:(el.querySelector('link')?.textContent||'').trim(),
        date:(el.querySelector('pubDate')?.textContent||'').trim(),
        source:''
      })).filter(x=>x.title);
      return Array.from(doc.querySelectorAll('entry')).map(el=>({
        title:(el.querySelector('title')?.textContent||'').trim(),
        url:(el.querySelector('link')?.getAttribute('href')||el.querySelector('link')?.textContent||'').trim(),
        date:(el.querySelector('updated')?.textContent||'').trim(),
        source:''
      })).filter(x=>x.title);
    } catch(e){ return []; }
  }

  async function fetchFeed(url){
    try {
      const res = await fetch(PROXY+encodeURIComponent(url),{cache:'no-store'});
      if(!res.ok) return [];
      const data = await res.json();
      const xml = (data && typeof data.contents === 'string') ? data.contents : '';
      return parseXml(xml);
    } catch(e){ return []; }
  }

  function dedupe(arr,max){
    const seen=new Set();
    return arr.filter(x=>{const k=x.url||x.title;if(!k||seen.has(k))return false;seen.add(k);return true;}).slice(0,Math.max(1,max));
  }

  function getCssVar(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  function storageKey(kind,key){ return 'nap_rss_'+kind+'_'+(key||'default'); }
  function safeJsonParse(raw, fallback){ try{ const v=JSON.parse(raw); return v ?? fallback; }catch(e){ return fallback; } }

  function getSelectedFeeds(kind, el){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key);
    const saved = safeJsonParse(localStorage.getItem(k) || 'null', null);
    if(Array.isArray(saved) && saved.length) return saved;
    const raw = (kind==='sidebar') ? (el.getAttribute('data-feeds')||'[]') : (el.getAttribute('data-rss')||'[]');
    const arr = safeJsonParse(raw, []);
    return Array.isArray(arr) ? arr : [];
  }

  function setSelectedFeeds(kind, el, feeds){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key);
    localStorage.setItem(k, JSON.stringify(feeds));
    if(kind==='sidebar') el.setAttribute('data-feeds', JSON.stringify(feeds));
    else el.setAttribute('data-rss', JSON.stringify(feeds));
  }

  function getLiveEnabled(kind, el){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_live';
    const v = localStorage.getItem(k);
    if(v==='1') return true;
    return (el.getAttribute('data-live')||'0') === '1';
  }

  function setLiveEnabled(kind, el, on){
    el.setAttribute('data-live', on ? '1' : '0');
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_live';
    localStorage.setItem(k, on ? '1' : '0');
  }

  function getMaxItems(kind, el){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_max';
    const v = localStorage.getItem(k);
    if(v && /^\d+$/.test(v)) return parseInt(v,10);
    if(kind==='ticker') return parseInt(el.getAttribute('data-rss-max')||'20',10);
    return parseInt(el.getAttribute('data-max')||'10',10);
  }

  function setMaxItems(kind, el, n){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_max';
    const val = String(Math.min(50, Math.max(1, parseInt(n,10)||10)));
    localStorage.setItem(k, val);
    if(kind==='ticker') el.setAttribute('data-rss-max', val);
    else el.setAttribute('data-max', val);
  }

  function applySidebarMax(el){
    try{
      const container = el.querySelector('.nap-rss-items');
      if(!container) return;
      const max = getMaxItems('sidebar', el);
      const kids = Array.from(container.children);
      kids.forEach((node, idx)=>{ node.style.display = (idx < max) ? '' : 'none'; });
    } catch(e){}
  }


  function renderPresetList(el, kind){
    const list = el.querySelector('.nap-rss-preset-list');
    if(!list) return;
    const selected = new Set(getSelectedFeeds(kind, el));
    const text = kind==='ticker' ? 'rgba(255,255,255,0.92)' : (getCssVar('--c-text')||'#1A2B4A');
    const muted = kind==='ticker' ? 'rgba(255,255,255,0.75)' : (getCssVar('--c-muted')||'#5A789A');
    const fb=getCssVar('--f-body')||'system-ui';
    list.innerHTML = PRESETS.map(p => {
      const checked = selected.has(p.url) ? 'checked' : '';
      return '<label style="display:flex;gap:8px;align-items:flex-start;font-family:'+fb+';font-size:12px;color:'+text+';line-height:1.3">'
        + '<input type="checkbox" data-url="'+esc(p.url)+'" '+checked+' style="transform:translateY(2px)" />'
        + '<span><span style="font-weight:600">'+esc(p.label)+'</span><br/><span style="color:'+muted+';font-size:11px">'+esc(p.url)+'</span></span>'
        + '</label>';
    }).join('');

    list.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const url = cb.getAttribute('data-url');
        const next = new Set(getSelectedFeeds(kind, el));
        if(cb.checked) next.add(url); else next.delete(url);
        setSelectedFeeds(kind, el, Array.from(next));
        const st = el.querySelector('.nap-rss-status');
        if(st) st.textContent = 'Selected '+next.size+' feed(s).';
      });
    });
  }

  function wireRssConfig(el, kind){
    const details = el.querySelector('.nap-rss-config');
    if(!details) return;
    const live = details.querySelector('.nap-rss-live');
    if(live){
      live.checked = getLiveEnabled(kind, el);
      live.addEventListener('change', () => {
        setLiveEnabled(kind, el, live.checked);
        const st = el.querySelector('.nap-rss-status');
        if(st) st.textContent = live.checked ? 'Live enabled. Refreshing…' : 'Live disabled (snapshot).';
        if(live.checked){
          if(kind==='sidebar') hydrateRssSidebar(el);
          else hydrateTicker(el);
        }
      });
    }
    renderPresetList(el, kind);
    const maxSel = details.querySelector('.nap-rss-max');
    if(maxSel){
      // Set initial value from persisted settings
      maxSel.value = String(getMaxItems(kind, el));
      maxSel.addEventListener('change', () => {
        setMaxItems(kind, el, maxSel.value);
        const st = el.querySelector('.nap-rss-status');
        if(st) st.textContent = 'Items per feed: ' + getMaxItems(kind, el) + '.';
        if(kind==='sidebar'){
          if(getLiveEnabled('sidebar', el)) hydrateRssSidebar(el);
          else applySidebarMax(el);
        } else {
          if(getLiveEnabled('ticker', el)) hydrateTicker(el);
        }
      });
    }
    const input = details.querySelector('.nap-rss-add');
    const btn = details.querySelector('.nap-rss-add-btn');
    function addUrl(){
      const v = (input && input.value || '').trim();
      if(!v) return;
      try{ new URL(v); } catch(e){ const st=el.querySelector('.nap-rss-status'); if(st) st.textContent='Invalid URL.'; return; }
      const next = new Set(getSelectedFeeds(kind, el));
      next.add(v);
      setSelectedFeeds(kind, el, Array.from(next));
      if(input) input.value='';
      renderPresetList(el, kind);
      const st = el.querySelector('.nap-rss-status');
      if(st) st.textContent='Added feed. Selected '+next.size+' feed(s).';
    }
    if(btn) btn.addEventListener('click', addUrl);
    if(input) input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); addUrl(); } });
    const st = el.querySelector('.nap-rss-status');
    if(st) st.textContent = 'Selected '+getSelectedFeeds(kind, el).length+' feed(s).';
  }

  /* ── Ticker ── */
  async function hydrateTicker(el){
    if(!el||el.getAttribute('data-source')!=='rss') return;
    if(!getLiveEnabled('ticker', el)) return;
    const urls = getSelectedFeeds('ticker', el);
    if(!urls.length) return;
    const max=parseInt(el.getAttribute('data-rss-max')||'20',10);
    const all=[];
    for(const u of urls){const items=await fetchFeed(u);all.push(...items);}
    const items=dedupe(all,max);
    if(!items.length) return;
    const textColor=el.style.color||'#fff';
    const accent=getCssVar('--c-accent')||'#009CDE';
    const fm=getCssVar('--f-mono')||'ui-monospace';
    const html=items.map(it=>
      '<a href="'+esc(it.url||'#')+'" target="_blank" rel="noopener noreferrer" '+
      'style="font-family:'+fm+';font-size:12px;color:'+textColor+';padding:0 32px;letter-spacing:0.04em;display:inline-flex;align-items:center;gap:10px;text-decoration:none">'+
      '<span style="width:5px;height:5px;border-radius:50%;background:'+accent+';display:inline-block;flex-shrink:0"></span>'+
      esc(it.title)+'<span style="font-size:10px;opacity:0.6">↗</span></a>'
    ).join('');
    const track=el.querySelector('.nap-ticker-track');
    if(track) track.innerHTML=html+html;
  }

  /* ── RSS Sidebar ── */
  async function hydrateRssSidebar(el){
    if(!el) return;
    if(!getLiveEnabled('sidebar', el)) return;
    const feeds = getSelectedFeeds('sidebar', el);
    if(!feeds.length) return;
    const max=getMaxItems('sidebar', el);
    const all=[];
    for(const u of feeds){
      const items=await fetchFeed(u);
      try{const host=new URL(u).hostname.replace(/^www\./,'');items.forEach(it=>it.source=host);}catch(e){}
      all.push(...items);
    }
    const items=dedupe(all,max);
    if(!items.length) return;
    const text=getCssVar('--c-text')||'#1A2B4A';
    const accent=getCssVar('--c-accent')||'#009CDE';
    const muted=getCssVar('--c-muted')||'#5A789A';
    const border=getCssVar('--c-border')||'#C8D9EE';
    const fb=getCssVar('--f-body')||'system-ui';
    const fm=getCssVar('--f-mono')||'ui-monospace';
    function fmtDate(d){try{return new Date(d).toLocaleDateString();}catch(e){return '';}}
    const container=el.querySelector('.nap-rss-items');
    if(!container) return;
    container.innerHTML=items.map((it,i)=>{
      const n=String(i+1).padStart(2,'0');
      const dt=it.date?fmtDate(it.date):'';
      return '<div style="padding:11px 18px;border-bottom:1px solid '+border+';display:flex;gap:10px;align-items:flex-start">'+
        '<span style="font-family:'+fm+';font-size:12px;color:'+accent+';flex-shrink:0;min-width:20px;margin-top:1px">'+n+'</span>'+
        '<div style="flex:1">'+
          '<div style="font-family:'+fb+';font-size:13px;font-weight:600;color:'+text+';line-height:1.3;margin-bottom:3px">'+
            (it.url?'<a href="'+esc(it.url)+'" target="_blank" rel="noopener" style="color:'+text+';text-decoration:none">'+esc(it.title)+'</a>':esc(it.title))+
          '</div>'+
          '<div style="display:flex;gap:8px;align-items:center">'+
            (it.source?'<span style="font-family:'+fm+';font-size:9px;color:'+muted+';text-transform:uppercase;letter-spacing:0.08em">'+esc(it.source)+'</span>':'')+
            (dt?'<span style="font-family:'+fm+';font-size:9px;color:'+muted+'">'+dt+'</span>':'')+
          '</div>'+
        '</div>'+
        (it.url?'<a href="'+esc(it.url)+'" target="_blank" rel="noopener" style="flex-shrink:0;font-family:'+fb+';font-size:11px;color:'+accent+';font-weight:600;text-decoration:none;padding-top:1px">↗</a>':'')+
      '</div>';
    }).join('');
    /* Update timestamp */
    const ts=el.querySelector('.nap-rss-timestamp');
    applySidebarMax(el);
    if(ts) ts.textContent='Updated '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  }

  /* ── Copy buttons ── */
  function initCopyButtons(){
    document.querySelectorAll('.nap-copy-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        const text=this.getAttribute('data-copy')||'';
        const orig=this.innerHTML;
        const accent=getCssVar('--c-accent')||'#009CDE';
        const done=()=>{
          this.innerHTML='✓ Copied!';
          this.style.background=accent;
          this.style.color='#fff';
          this.style.border='none';
          setTimeout(()=>{this.innerHTML=orig;this.style.background='';this.style.color='';this.style.border='';},2000);
        };
        if(navigator.clipboard){
          navigator.clipboard.writeText(text).then(done).catch(()=>done());
        } else {
          const ta=document.createElement('textarea');
          ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
          document.body.appendChild(ta);ta.select();document.execCommand('copy');
          document.body.removeChild(ta);done();
        }
      });
    });
  }

  /* ── Template expand ── */
  function initExpandButtons(){
    document.querySelectorAll('.nap-expand-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        const target=document.getElementById(this.getAttribute('data-target'));
        if(!target) return;
        const isOpen=target.classList.toggle('open');
        this.textContent=isOpen?'Collapse':'Preview';
      });
    });
  }

  // Wire RSS config UIs (snapshot-first; live optional)
  document.querySelectorAll('.nap-ticker[data-source="rss"]').forEach(el=>wireRssConfig(el,'ticker'));
  document.querySelectorAll('.nap-rss-sidebar').forEach(el=>wireRssConfig(el,'sidebar'));
  document.querySelectorAll('.nap-rss-sidebar').forEach(el=>applySidebarMax(el));

  // Only hydrate if live is enabled (persisted)
  document.querySelectorAll('.nap-ticker[data-source="rss"]').forEach(el=>{ if(getLiveEnabled('ticker', el)) hydrateTicker(el); });
  document.querySelectorAll('.nap-rss-sidebar').forEach(el=>{ if(getLiveEnabled('sidebar', el)) hydrateRssSidebar(el); });
  initCopyButtons();
  initExpandButtons();

  /* ── Hourly live refresh ── */
  const REFRESH_MS = 60 * 60 * 1000; // 1 hour
  setInterval(function() {
    document.querySelectorAll('.nap-ticker[data-source="rss"]').forEach(el=>{ if(getLiveEnabled('ticker', el)) hydrateTicker(el); });
    document.querySelectorAll('.nap-rss-sidebar').forEach(el=>{ if(getLiveEnabled('sidebar', el)) hydrateRssSidebar(el); });
  }, REFRESH_MS);

  /* Show a subtle "Live" indicator on the RSS sidebar header */
  document.querySelectorAll('.nap-rss-sidebar').forEach(function(rssEl){
    const header = rssEl.querySelector('div');
    if (!header) return;
    const dot = document.createElement('span');
    dot.title = 'Updates every hour (when Live is enabled)';
    dot.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#00A651;display:inline-block;margin-left:auto;animation:nap_pulse 2s ease-in-out infinite;opacity:0.85';
    header.appendChild(dot);
  });
})();
<\/script>`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

function blockToHtml(block: Block, theme: Newsletter['theme']): string {
  const b = block as any;
  switch (block.type) {
    case 'header':                    return renderHeader(b, theme);
    case 'ticker':                    return renderTicker(b, theme);
    case 'section-divider':           return renderSectionDivider(b, theme);
    case 'article-grid':              return renderArticleGrid(b, theme);
    case 'spotlight':                 return renderSpotlight(b, theme);
    case 'ethics-split':              return renderEthicsSplit(b, theme);
    case 'image':                     return renderImage(b, theme);
    case 'text':                      return renderText(b, theme);
    case 'html-embed':                return renderHtmlEmbed(b, theme);
    case 'prompt-masterclass':        return renderPromptMasterclass(b, theme);
    case 'sbar-prompt':               return renderSbarPrompt(b, theme);
    case 'prompt-template':           return renderPromptTemplate(b, theme);
    case 'safety-reminders':          return renderSafetyReminders(b, theme);
    case 'clinical-prompt-templates': return renderClinicalPromptTemplates(b, theme);
    case 'term-of-month':             return renderTermOfMonth(b, theme);
    case 'ai-case-file':              return renderAiCaseFile(b, theme);
    case 'quick-hits':                return renderQuickHits(b, theme);
    case 'humor':                     return renderHumor(b, theme);
    case 'spacer':                    return renderSpacer(b, theme);
    case 'ai-safety':                 return renderAiSafety(b, theme);
    case 'northwell-spotlight':       return renderNorthwellSpotlight(b, theme);
    case 'rss-sidebar':               return renderRssSidebar(b, theme);
    case 'footer':                    return renderFooter(b, theme);
    default:
      return `<!-- unsupported block: ${(block as any).type} -->`;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function exportToHtml(
  newsletter: Newsletter,
  opts?: { baseFontPx?: number; extraCss?: string }
): string {
  const { theme, blocks, blockOrder } = newsletter;
  const body = blockOrder.map(id => blocks[id] ? blockToHtml(blocks[id], theme) : '').join('\n');
  const baseFontPx = opts?.baseFontPx;
  const extraCss = opts?.extraCss || '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(newsletter.meta?.title || 'Neurology AI Pulse')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300;1,9..40,400&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">
<style>
${getExportCss(theme, baseFontPx)}
${extraCss}
</style>
</head>
<body>
<div class="nap-export-wrap">
  <div class="nap-shell">
  ${body}
  </div>
</div>
${runtimeScript()}
</body>
</html>`;
}

export function downloadHtml(newsletter: Newsletter) {
  // Capture the *actual* typography CSS that the editor/preview is using.
  // This makes the exported HTML match the in-app rendering 1:1.
  let extraCss = '';
  try {
    const sheets = Array.from(document.styleSheets || []);
    const chunks: string[] = [];
    for (const s of sheets) {
      try {
        const rules = (s as CSSStyleSheet).cssRules;
        if (!rules) continue;
        for (const r of Array.from(rules)) chunks.push(r.cssText);
      } catch {
        // Cross-origin stylesheets can't be read; ignore.
      }
    }
    extraCss = chunks.join('\n');
  } catch {
    extraCss = '';
  }

  // Match the app's root font size.
  const baseFontPx = (() => {
    try {
      const n = parseFloat(getComputedStyle(document.documentElement).fontSize);
      // Export slightly smaller than the editor to better match typical email/newsletter rendering.
      // This improves perceived fidelity when viewed in browsers and email clients.
      return Number.isFinite(n) ? Math.max(12, n * 0.92) : undefined;
    } catch {
      return undefined;
    }
  })();

  const html = exportToHtml(newsletter, { baseFontPx, extraCss });
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nap-issue-${newsletter.meta?.issueNumber || 'draft'}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
