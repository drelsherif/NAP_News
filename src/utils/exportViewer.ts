/**
 * exportViewer.ts
 *
 * Generates newsletter_viewer.html — a standalone Option B viewer shell.
 *
 * How it works:
 *   1. Viewer HTML is a self-contained page with all CSS + rendering JS embedded.
 *   2. On load, it resolves the newsletter JSON in priority order:
 *        a) window.__NEWSLETTER__  — embedded JSON (single-file mode, most portable)
 *        b) ?json=filename.json    — URL param pointing to a sidecar file
 *        c) Auto-detect            — looks for newsletter_issue{N}.json in same folder
 *             based on a <meta name="nap-issue"> tag OR tries common filenames
 *        d) Any newsletter_issue*.json via directory listing (won't work on file://)
 *   3. Once JSON is loaded, it calls renderNewsletter(data) which re-implements
 *      every block renderer from export.ts as vanilla JS.
 *   4. The runtime script (RSS, copy buttons, etc.) runs identically to the exported HTML.
 *
 * Two usage patterns:
 *   Pattern A — Embedded (double-click works):
 *     Export JSON → open viewer with "Embed JSON" option → single .html file
 *
 *   Pattern B — Sidecar (best for sharing folders/hosting):
 *     Place newsletter_viewer.html + newsletter_issue001.json in same folder
 *     Open with a local server (e.g. npx serve .) or any web host
 *
 * File naming convention enforced here:
 *   JSON:   newsletter_issue{N}.json   (e.g. newsletter_issue001.json)
 *   Viewer: newsletter_viewer.html
 */

import type { Newsletter } from '../types';
import { RUNTIME_JS } from './exportRuntime';
import { newsletterJsonFilename, downloadJson } from './exportJson';

// ─── Viewer shell HTML ─────────────────────────────────────────────────────────

// This file historically generated a single-page viewer.
// To support accurate Desktop/Tablet/Phone previews (triggering real CSS media queries),
// we now wrap the original viewer inside an <iframe> and resize the iframe.
// The inner viewer remains unchanged and still supports embedded JSON or a sidecar JSON file.

function buildViewerHtml(embeddedJson: string | null, issueFilename: string): string {
  const inner = buildInnerViewerHtml(embeddedJson, issueFilename);
  // IMPORTANT: The outer HTML embeds the inner HTML string inside a <script> tag.
  // If the inner HTML contains a literal "</script>", the browser will terminate
  // the *outer* script tag early (even if it's inside a JS string literal), which
  // corrupts the page and causes "Invalid or unexpected token".
  // Therefore we must escape ALL closing script tags in the embedded string.
  const innerJs = JSON.stringify(inner).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300;1,9..40,400&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { height: 100%; }
    body { margin: 0; background: #F0F4FA; font-family: "DM Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }

    .nap-shell { height: 100%; display: flex; flex-direction: column; }

    .nap-topbar {
      position: sticky; top: 0; z-index: 10;
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; gap: 12px;
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }

    .nap-title { font-family: "DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; letter-spacing: 0.08em; color: #234; opacity: 0.8; text-transform: uppercase; }

    .nap-controls { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .nap-btn {
      border: 1px solid rgba(0,0,0,0.10);
      background: #fff;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 13px;
      cursor: pointer;
      color: #0f2b46;
      box-shadow: 0 6px 18px rgba(0,0,0,0.06);
    }
    .nap-btn[aria-pressed="true"] { border-color: rgba(0,156,222,0.55); box-shadow: 0 8px 24px rgba(0,156,222,0.18); }

    .nap-stage {
      flex: 1;
      display: grid;
      place-items: start center;
      padding: 18px 12px 28px;
      overflow: auto;
    }

    .nap-frame-wrap {
      background: transparent;
      border-radius: 18px;
      padding: 0;
    }

    iframe#nap-frame {
      width: 1100px; /* default desktop */
      height: calc(100vh - 88px);
      border: 1px solid rgba(0,0,0,0.10);
      border-radius: 18px;
      background: #ffffff;
      box-shadow: 0 14px 50px rgba(0,0,0,0.12);
    }

    @media (max-width: 1240px) {
      iframe#nap-frame { width: min(1100px, calc(100vw - 24px)); }
    }
  </style>
</head>
<body>
  <div class="nap-shell">
    <div class="nap-topbar">
      <div class="nap-title">Export Viewer</div>
      <div class="nap-controls">
        <button class="nap-btn" id="nap-desktop" aria-pressed="true">Desktop</button>
        <button class="nap-btn" id="nap-tablet" aria-pressed="false">Tablet</button>
        <button class="nap-btn" id="nap-phone" aria-pressed="false">Phone</button>
        <button class="nap-btn" id="nap-print">Print</button>
      </div>
    </div>

    <div class="nap-stage">
      <div class="nap-frame-wrap">
        <iframe id="nap-frame" title="Newsletter preview" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" referrerpolicy="no-referrer"></iframe>
      </div>
    </div>
  </div>

  <script>
    const INNER_HTML = ${innerJs};
    const frame = document.getElementById('nap-frame');
    frame.srcdoc = INNER_HTML;

    const setPressed = (id) => {
      ['nap-desktop','nap-tablet','nap-phone'].forEach(x => {
        const b = document.getElementById(x);
        b.setAttribute('aria-pressed', x === id ? 'true' : 'false');
      });
    };

    const setMode = (mode) => {
      if (mode === 'desktop') { frame.style.width = '1100px'; setPressed('nap-desktop'); }
      if (mode === 'tablet')  { frame.style.width = '820px';  setPressed('nap-tablet'); }
      if (mode === 'phone')   { frame.style.width = '420px';  setPressed('nap-phone'); }
    };

    document.getElementById('nap-desktop').addEventListener('click', () => setMode('desktop'));
    document.getElementById('nap-tablet').addEventListener('click', () => setMode('tablet'));
    document.getElementById('nap-phone').addEventListener('click', () => setMode('phone'));

    document.getElementById('nap-print').addEventListener('click', () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch (e) {
        // Fallback: print the parent page
        window.print();
      }
    });

    // Default
    setMode('desktop');
  </script>
</body>
</html>`;
}

function buildInnerViewerHtml(embeddedJson: string | null, issueFilename: string): string {
  // Embedded JSON — must escape </script> inside JSON (e.g. in html-embed blocks).
  const safeJson = embeddedJson
    ? embeddedJson.replace(/<\/script>/gi, '<\\\/script>')
    : null;
  const embeddedScript = safeJson
    ? `<script>window.__NEWSLETTER__ = ${safeJson};<\/script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="nap-issue-file" content="${issueFilename}">
  <title>Newsletter Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300;1,9..40,400&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">
  <style>
    /* ── Base reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    body { font-family: "DM Sans", system-ui, sans-serif; background: #F0F4FA; -webkit-font-smoothing: antialiased; }

    /* ── Loading state ── */
    #nap-loading {
      position: fixed; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: #F0F4FA; z-index: 1000; gap: 16px;
    }
    #nap-loading .spinner {
      width: 40px; height: 40px; border-radius: 50%;
      border: 3px solid #C8D9EE; border-top-color: #009CDE;
      animation: spin 0.8s linear infinite;
    }
    #nap-loading p { font-family: "DM Mono", monospace; font-size: 13px; color: #5A789A; letter-spacing: 0.08em; }

    /* ── Error state ── */
    #nap-error {
      display: none; position: fixed; inset: 0;
      align-items: center; justify-content: center;
      background: #F0F4FA; z-index: 1000; padding: 24px;
    }
    #nap-error .card {
      background: #fff; border-radius: 16px; padding: 40px;
      max-width: 520px; width: 100%; text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,0.10);
    }
    #nap-error .icon { font-size: 48px; margin-bottom: 16px; }
    #nap-error h2 { font-family: "DM Serif Display", Georgia, serif; font-size: 26px; font-weight: 400; color: #1A2B4A; margin-bottom: 10px; }
    #nap-error p { font-size: 14px; color: #5A789A; line-height: 1.6; margin-bottom: 20px; }
    #nap-error code { font-family: "DM Mono", monospace; font-size: 12px; background: #F0F4FA; padding: 2px 6px; border-radius: 4px; color: #003087; }
    #nap-error .hint { font-size: 12px; color: #5A789A; margin-top: 16px; padding: 12px 16px; background: #F0F4FA; border-radius: 8px; text-align: left; line-height: 1.7; }

    /* ── Drop zone overlay ── */
    #nap-drop-overlay {
      display: none; position: fixed; inset: 0; z-index: 900;
      background: rgba(0,156,222,0.15); border: 4px dashed #009CDE;
      align-items: center; justify-content: center;
      font-family: "DM Mono", monospace; font-size: 18px; color: #003087;
      letter-spacing: 0.1em;
    }

    /* ── Toolbar ── */
    #nap-toolbar {
      display: none; /* hidden until content loads */
      position: fixed; bottom: 20px; right: 20px; z-index: 800;
      display: flex; gap: 8px;
    }
    #nap-toolbar button {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 16px; border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.3);
      background: #003087; color: #fff;
      font-family: "DM Sans", system-ui, sans-serif;
      font-size: 13px; font-weight: 500; cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      transition: background 0.15s;
    }
    #nap-toolbar button:hover { background: #0057A8; }
    #nap-toolbar button.secondary {
      background: rgba(255,255,255,0.95); color: #003087;
      border-color: #C8D9EE;
    }
    #nap-toolbar button.secondary:hover { background: #fff; }

    /* ── Content ── */
    #nap-content { display: none; min-height: 100vh; }

    /* ── Animations ── */
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes nap_ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes nap_pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

    /* ── Responsive ── */
    @media (max-width: 680px) {
      .nap-2col, .nap-3col, .nap-5col { display: block !important; }
      .nap-2col > *, .nap-3col > *, .nap-5col > * { margin-bottom: 14px; }
      #nap-toolbar { bottom: 12px; right: 12px; }
      #nap-toolbar button { font-size: 12px; padding: 8px 12px; }
    }
    @media print {
      #nap-toolbar, #nap-loading, #nap-error, #nap-drop-overlay { display: none !important; }
      body { background: #fff !important; }
      .nap-shell { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
      .nap-ticker { display: none !important; }
      @page { size: A4 portrait; margin: 18mm 16mm; }
    }
  </style>
  ${embeddedScript}
</head>
<body>

  <!-- Loading indicator -->
  <div id="nap-loading">
    <div class="spinner"></div>
    <p>Loading newsletter…</p>
  </div>

  <!-- Error state -->
  <div id="nap-error">
    <div class="card">
      <div class="icon">📄</div>
      <h2>Newsletter not found</h2>
      <p id="nap-error-msg">Could not load the newsletter JSON file.</p>
      <div class="hint" id="nap-error-hint">
        <strong>To use this viewer:</strong><br>
        1. Place <code id="nap-error-filename">newsletter_issue001.json</code> in the same folder as this HTML file.<br>
        2. Open using a local server: <code>npx serve .</code> or VS Code Live Server.<br>
        3. Or drag &amp; drop the JSON file onto this page.
      </div>
      <p style="margin-top:16px;font-size:12px;color:#5A789A">
        Or <label style="color:#009CDE;cursor:pointer;text-decoration:underline">
          browse for a JSON file
          <input type="file" id="nap-file-input" accept=".json" style="display:none">
        </label>
      </p>
    </div>
  </div>

  <!-- Drop overlay -->
  <div id="nap-drop-overlay">📂 Drop JSON file here</div>

  <!-- Toolbar (shown after load) -->
  <div id="nap-toolbar">
    <button class="secondary" id="btn-load-file" title="Load a different issue JSON">📂 Load Issue</button>
    <button id="btn-print" title="Print / Save as PDF">🖨️ Print</button>
    <input type="file" id="nap-toolbar-file" accept=".json" style="display:none">
  </div>

  <!-- Rendered content -->
  <div id="nap-content"></div>

<script>
(function() {
  'use strict';

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function normalizeTerms(terms) {
    if (!terms) return [];
    if (Array.isArray(terms)) return terms.filter(Boolean).map(String);
    if (typeof terms === 'string') {
      var parts = []; var chunks = terms.split(','); for(var ci=0;ci<chunks.length;ci++){var p=chunks[ci].trim();if(p)parts.push(p);}
      return parts.length ? parts : [terms.trim()];
    }
    return [String(terms)];
  }

  // ── CSS injection from theme ─────────────────────────────────────────────────
  function applyThemeCss(theme) {
    var el = document.getElementById('nap-theme-css');
    if (!el) { el = document.createElement('style'); el.id = 'nap-theme-css'; document.head.appendChild(el); }
    el.textContent = [
      ':root {',
      '  --c-primary: ' + theme.primary + ';',
      '  --c-secondary: ' + theme.secondary + ';',
      '  --c-accent: ' + theme.accent + ';',
      '  --c-bg: ' + theme.background + ';',
      '  --c-surface: ' + theme.surface + ';',
      '  --c-border: ' + theme.border + ';',
      '  --c-text: ' + theme.text + ';',
      '  --c-muted: ' + theme.muted + ';',
      '  --f-display: ' + theme.fontDisplay + ';',
      '  --f-body: ' + theme.fontBody + ';',
      '  --f-mono: ' + theme.fontMono + ';',
      '}',
      '*, *::before, *::after { box-sizing: border-box; }',
      'html, body { margin: 0; height: auto !important; overflow: auto !important; }',
      'body { font-family: var(--f-body); color: var(--c-text); background: var(--c-bg); padding: 22px 0; -webkit-font-smoothing: antialiased; }',
      'a { color: var(--c-accent); text-decoration: none; }',
      'a:hover { text-decoration: underline; }',
      '.nap-ticker a { color: inherit !important; text-decoration: none !important; }',
      '.nap-ticker span { color: inherit; }',
      '.nap-white-section a { color: inherit; }',
      'img { max-width: 100%; display: block; }',
      '.nap-export-wrap { width: 100%; display: flex; justify-content: center; }',
      '.nap-shell { max-width: 900px; width: 100%; margin: 0 auto; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 18px; overflow: hidden; box-shadow: 0 14px 40px rgba(0,0,0,0.10); }',
      '[contenteditable] { outline: none !important; }',
      '.nap-ticker-track { display: flex; white-space: nowrap; will-change: transform; }',
      '.nap-tpl-prompt { display: none; padding: 10px 14px; }',
      '.nap-tpl-prompt.open { display: block; }',
      '.nap-copy-btn { cursor: pointer; color: #fff !important; }',
      '.nap-expand-btn { cursor: pointer; }',
      '.nap-rss-scroll { max-height: none !important; overflow: visible !important; }',
      '.nap-sbar-letter { font-size:56px !important; font-weight:400 !important; line-height:1 !important; margin-bottom:6px !important; font-style:italic !important; text-transform:uppercase !important; }',
      '.ai-related-pill { display: inline-block !important; background: #F3F6FF !important; border: 1px solid var(--c-border) !important; color: var(--c-text) !important; padding: 4px 10px !important; border-radius: 999px !important; font-family: var(--f-mono) !important; font-size: 11px !important; line-height: 16px !important; margin: 0 6px 0 0 !important; }',
      '@keyframes nap_ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }',
      '@keyframes nap_pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }',
      '@media (max-width: 680px) { .nap-2col, .nap-3col, .nap-5col { display: block !important; } .nap-2col > *, .nap-3col > *, .nap-5col > * { margin-bottom: 14px; } }'
    ].join(' ');
  }

  // ── Block renderers ─────────────────────────────────────────────────────────
  // These are the same HTML strings as export.ts but as vanilla JS functions.

  function renderBlock(block, t) {
    var b = block;
    switch (block.type) {
      case 'header':                    return renderHeader(b, t);
      case 'ticker':                    return renderTicker(b, t);
      case 'section-divider':           return renderSectionDivider(b, t);
      case 'article-grid':              return renderArticleGrid(b, t);
      case 'spotlight':                 return renderSpotlight(b, t);
      case 'ethics-split':              return renderEthicsSplit(b, t);
      case 'image':                     return renderImage(b, t);
      case 'text':                      return renderText(b, t);
      case 'html-embed':                return renderHtmlEmbed(b, t);
      case 'prompt-masterclass':        return renderPromptMasterclass(b, t);
      case 'sbar-prompt':               return renderSbarPrompt(b, t);
      case 'prompt-template':           return renderPromptTemplate(b, t);
      case 'safety-reminders':          return renderSafetyReminders(b, t);
      case 'clinical-prompt-templates': return renderClinicalPromptTemplates(b, t);
      case 'term-of-month':             return renderTermOfMonth(b, t);
      case 'ai-case-file':              return renderAiCaseFile(b, t);
      case 'quick-hits':                return renderQuickHits(b, t);
      case 'humor':                     return renderHumor(b, t);
      case 'spacer':                    return renderSpacer(b, t);
      case 'ai-safety':                 return renderAiSafety(b, t);
      case 'institutional-spotlight':   return renderInstitutionalSpotlight(b, t);
      case 'rss-sidebar':               return renderRssSidebar(b, t);
      case 'footer':                    return renderFooter(b, t);
      default: return '';
    }
  }

  function renderHeader(b, t) {
    var bg = b.backgroundStyle === 'solid' ? t.primary : ('linear-gradient(135deg,' + t.primary + ' 0%,' + t.secondary + ' 60%,' + t.accent + '44 100%)');
    return '<div class="nap-white-section" style="background:' + bg + ';padding:48px 40px;text-align:center;position:relative;overflow:hidden;color:#fff">'
      + '<svg style="position:absolute;bottom:0;left:0;right:0;opacity:0.08" viewBox="0 0 800 60" fill="none" preserveAspectRatio="none" height="60"><path d="M0 40 Q200 0 400 30 Q600 60 800 20 L800 60 L0 60Z" fill="white"/></svg>'
      + ((b.logoDataUrl||b.logoUrl) ? '<div style="margin-bottom:20px"><img src="' + esc(b.logoDataUrl||b.logoUrl) + '" alt="Logo" style="max-height:60px;max-width:240px;border-radius:8px;display:inline-block;margin:0 auto"></div>' : '')
      + '<div style="font-family:' + t.fontMono + ';font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:12px">' + esc(b.issueNumber) + ' · ' + esc(b.issueDate) + '</div>'
      + '<h1 style="font-family:' + t.fontDisplay + ';font-size:46px;font-weight:400;color:#fff;margin:0 0 10px;letter-spacing:-0.02em;line-height:1.1">' + esc(b.title) + '</h1>'
      + '<p style="font-family:' + t.fontDisplay + ';font-size:20px;font-style:italic;color:rgba(255,255,255,0.92);margin:0 0 18px;line-height:1.3">' + esc(b.subtitle) + '</p>'
      + '<div style="height:1px;background:rgba(255,255,255,0.3);max-width:280px;margin:0 auto 18px"></div>'
      + '<p style="font-family:' + t.fontBody + ';font-size:13px;color:rgba(255,255,255,0.85);margin:0;letter-spacing:0.02em">' + esc(b.tagline) + '</p>'
      + '</div>';
  }

  function renderTicker(b, t) {
    var dur = ({slow:60,medium:36,fast:20})[b.speed] || 36;
    var textColor = b.textColor || '#ffffff';
    var bg = b.backgroundColor || t.primary;
    var accentDot = '<span style="width:5px;height:5px;border-radius:50%;background:' + t.accent + ';display:inline-block;flex-shrink:0"></span>';
    var itemStyle = 'font-family:' + t.fontMono + ';font-size:12px;color:' + textColor + ';padding:0 32px;letter-spacing:0.04em;display:inline-flex;align-items:center;gap:10px;text-decoration:none';
    var seedHtml = '';
    if (b.sourceMode === 'rss' || b.useLinks) {
      seedHtml = (b.links || []).filter(function(x){return x&&x.text;}).map(function(x){
        return '<a class="nap-ticker-item" href="' + esc(x.url||'#') + '" target="_blank" rel="noopener noreferrer" style="' + itemStyle + '">' + accentDot + esc(x.text) + '<span style="font-size:10px;opacity:0.6;color:' + textColor + '">↗</span></a>';
      }).join('');
    } else {
      seedHtml = (b.items || []).map(function(item){
        return '<span class="nap-ticker-item" style="' + itemStyle + '">' + accentDot + esc(item) + '</span>';
      }).join('');
    }
    var dataRss = esc(JSON.stringify((b.rssUrls||[]).filter(Boolean)));
    return '<div class="nap-ticker" data-source="' + esc(b.sourceMode||'manual') + '" data-rss=\"\" data-rss-max="' + esc(String(b.rssMaxItems||20)) + '" data-live="0" data-key="' + esc(b.id||'ticker') + '" style="background:' + bg + ';overflow:hidden;height:40px;display:flex;align-items:center;color:' + textColor + '">'
      + '<div class="nap-ticker-track" style="animation:nap_ticker ' + dur + 's linear infinite">' + seedHtml + seedHtml + '</div>'
      + '</div>';
  }

  function renderSectionDivider(b, t) {
    if (b.style === 'bold') {
      return '<div class="nap-white-section" style="background:' + t.primary + ';padding:18px 40px;display:flex;align-items:center;gap:16px;color:#fff">'
        + (b.number > 0 ? '<span style="font-family:' + t.fontMono + ';font-size:32px;font-weight:300;color:rgba(255,255,255,0.25);line-height:1">' + esc(String(b.number).padStart(2,'0')) + '</span>' : '')
        + '<div><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:2px">Section</div>'
        + '<div style="font-family:' + t.fontDisplay + ';font-size:22px;color:#fff;line-height:1.15">' + esc(b.label) + '</div></div></div>';
    }
    return '<div style="padding:32px 40px 16px">'
      + '<div style="display:flex;align-items:center;gap:14px;margin-bottom:' + (b.description ? 10 : 0) + 'px">'
      + '<div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:' + t.muted + ';white-space:nowrap">'
      + '<span>' + (b.number > 0 ? '0' + b.number + ' —— ' : '—— ') + '</span>' + esc(b.label) + '<span> ——</span></div>'
      + '<div style="flex:1;height:1px;background:linear-gradient(90deg,' + t.border + ',transparent)"></div>'
      + '</div>'
      + (b.description ? '<p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.muted + ';margin:0;line-height:1.6">' + esc(b.description) + '</p>' : '')
      + '</div>';
  }

  function renderArticleCard(art, t) {
    var evidenceColors = {High:'#00A651',Moderate:'#F47920',Low:'#C0392B','Expert Opinion':'#7B2D8B'};
    var ec = art.evidenceLevel ? evidenceColors[art.evidenceLevel] : null;
    var titleHtml = art.url
      ? '<a href="' + esc(art.url) + '" target="_blank" rel="noopener noreferrer" style="color:' + t.text + ';text-decoration:none">' + esc(art.title) + '</a>'
      : esc(art.title);
    return '<div style="border:1px solid ' + t.border + ';border-radius:12px;overflow:hidden;background:' + t.surface + ';display:flex;flex-direction:column">'
      + (art.imageUrl ? '<div style="height:160px;overflow:hidden;flex-shrink:0"><img src="' + esc(art.imageUrl) + '" alt="' + esc(art.title) + '" style="width:100%;height:100%;object-fit:cover"></div>' : '')
      + '<div style="padding:16px;flex:1;display:flex;flex-direction:column">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">'
      + '<span style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:' + t.muted + '">' + esc(art.source||'') + '</span>'
      + (ec ? '<span style="background:' + ec + '22;color:' + ec + ';border:1px solid ' + ec + '44;border-radius:999px;padding:2px 8px;font-family:' + t.fontMono + ';font-size:10px;font-weight:600">' + esc(art.evidenceLevel) + '</span>' : '')
      + '</div>'
      + '<h3 style="font-family:' + t.fontDisplay + ';font-size:20px;color:' + t.text + ';margin:0 0 10px;line-height:1.25;font-weight:400">' + titleHtml + '</h3>'
      + (art.summary ? '<p style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.muted + ';margin:0 0 12px;line-height:1.6;flex:1">' + esc(art.summary) + '</p>' : '')
      + (art.clinicalContext ? '<div style="background:' + t.background + ';border-radius:8px;padding:10px 12px;margin-bottom:10px"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:' + t.muted + ';margin-bottom:4px">Clinical Context</div><p style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.text + ';margin:0;line-height:1.55">' + esc(art.clinicalContext) + '</p></div>' : '')
      + (art.myTake ? '<p style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.secondary + ';font-style:italic;margin:0 0 12px;border-left:3px solid ' + t.accent + ';padding-left:10px;line-height:1.5">' + esc(art.myTake) + '</p>' : '')
      + (art.url ? '<a href="' + esc(art.url) + '" target="_blank" rel="noopener noreferrer" style="margin-top:auto;display:inline-flex;align-items:center;gap:5px;font-family:' + t.fontBody + ';font-size:12px;color:' + t.accent + ';font-weight:600;text-decoration:none">Read full paper <span style="font-size:14px">→</span></a>' : '')
      + '</div></div>';
  }

  function renderArticleGrid(b, t) {
    var cols = b.columns || 2;
    var cards = (b.articles || []).map(function(art){ return renderArticleCard(art, t); }).join('');
    return '<div style="padding:24px 40px">'
      + (b.sectionTitle ? '<h2 style="font-family:' + t.fontDisplay + ';font-size:26px;color:' + t.text + ';margin:0 0 20px;font-weight:400">' + esc(b.sectionTitle) + '</h2>' : '')
      + '<div class="nap-' + cols + 'col" style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:20px">' + cards + '</div>'
      + '</div>';
  }

  function renderSpotlight(b, t) {
    var art = b.article || {};
    var accent = b.accentColor || t.accent;
    var isTop = b.layout === 'top-image';
    var isLeft = b.layout === 'left-image';
    var hasImage = !!art.imageUrl;
    var titleHtml = art.url ? '<a href="' + esc(art.url) + '" target="_blank" rel="noopener noreferrer" style="color:' + t.text + ';text-decoration:none">' + esc(art.title) + '</a>' : esc(art.title);
    var readBtn = art.url ? '<a href="' + esc(art.url) + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;background:' + accent + ';color:#fff;border-radius:8px;font-family:' + t.fontBody + ';font-size:13px;font-weight:600;text-decoration:none">Read the paper →</a>' : '';
    var inner = '<div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:' + t.muted + ';margin-bottom:12px">✦ Spotlight · ' + esc(art.source||'') + '</div>'
      + '<h2 style="font-family:' + t.fontDisplay + ';font-size:28px;color:' + t.text + ';margin:0 0 12px;font-weight:400;line-height:1.2">' + titleHtml + '</h2>'
      + (art.summary ? '<p style="font-family:' + t.fontBody + ';font-size:15px;color:' + t.muted + ';margin:0 0 16px;line-height:1.65">' + esc(art.summary) + '</p>' : '')
      + (art.clinicalContext ? '<div style="background:' + t.background + ';border-radius:10px;padding:14px 16px;margin-bottom:14px"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:' + t.muted + ';margin-bottom:6px">Clinical Context</div><p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.text + ';margin:0;line-height:1.6">' + esc(art.clinicalContext) + '</p></div>' : '')
      + (art.myTake ? '<p style="font-family:' + t.fontBody + ';font-size:14px;font-style:italic;color:' + t.secondary + ';margin:0 0 16px;border-left:3px solid ' + accent + ';padding-left:12px;line-height:1.6">' + esc(art.myTake) + '</p>' : '')
      + readBtn;
    if (isTop && hasImage) {
      return '<div style="padding:24px 40px"><div style="border:1px solid ' + t.border + ';border-radius:14px;overflow:hidden;background:' + t.surface + '"><img src="' + esc(art.imageUrl) + '" alt="' + esc(art.title||'') + '" style="width:100%;height:280px;object-fit:cover"><div style="padding:24px">' + inner + '</div></div></div>';
    }
    var imgHtml = hasImage ? '<div style="width:40%;flex-shrink:0"><img src="' + esc(art.imageUrl) + '" alt="' + esc(art.title||'') + '" style="width:100%;height:100%;object-fit:cover;display:block"></div>' : '';
    var flexDir = hasImage ? (isLeft ? 'row' : 'row-reverse') : 'column';
    var bl = (hasImage && isLeft) ? 'border-left:4px solid ' + accent + ';' : '';
    return '<div style="padding:24px 40px"><div style="border:1px solid ' + t.border + ';border-radius:14px;overflow:hidden;background:' + t.surface + ';display:flex;flex-direction:' + flexDir + '">' + imgHtml + '<div style="flex:1;padding:28px;' + bl + '">' + inner + '</div></div></div>';
  }

  function renderEthicsSplit(b, t) {
    var sourceLink = b.source ? (b.url ? '<a href="' + esc(b.url) + '" target="_blank" rel="noopener noreferrer" style="color:' + t.accent + '">' + esc(b.source) + '</a>' : esc(b.source)) : '';
    return '<div style="padding:28px 40px">'
      + '<div style="margin-bottom:20px">'
      + '<div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:6px">⚖ AI Ethics &amp; Governance</div>'
      + '<h2 style="font-family:' + t.fontDisplay + ';font-size:26px;color:' + t.text + ';margin:0 0 6px;font-weight:400">' + esc(b.heading||'') + '</h2>'
      + '<p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.muted + ';margin:0">' + esc(b.subheading||'') + '</p>'
      + (b.source !== undefined ? '<div style="font-family:' + t.fontMono + ';font-size:11px;color:' + t.muted + ';margin-top:6px">Source: ' + sourceLink + '</div>' : '')
      + '</div>'
      + '<div class="nap-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px">'
      + '<div style="border:1px solid ' + t.border + ';border-radius:12px;padding:20px;background:' + t.background + '"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C0392B;font-weight:700;margin-bottom:10px">' + esc(b.leftTitle||'') + '</div><p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.text + ';margin:0;line-height:1.65">' + esc(b.leftContent||'') + '</p></div>'
      + '<div style="border:1px solid ' + t.accent + '44;border-radius:12px;padding:20px;background:' + t.accent + '0A"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:' + t.accent + ';font-weight:700;margin-bottom:10px">' + esc(b.rightTitle||'') + '</div><p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.text + ';margin:0;line-height:1.65">' + esc(b.rightContent||'') + '</p></div>'
      + '</div>'
      + '<div style="padding:14px 18px;border:1px solid ' + t.border + ';border-radius:12px;border-left:4px solid ' + t.accent + '"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:' + t.muted + ';margin-bottom:6px">Clinical Perspective</div><p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.text + ';margin:0;line-height:1.65">' + esc(b.clinicalPerspective||'') + '</p></div>'
      + '</div>';
  }

  function renderImage(b, t) {
    var src = b.dataUrl || b.url;
    if (!src) return '';
    var widthMap = {full:'100%',wide:'80%',medium:'60%',small:'40%'};
    var maxW = widthMap[b.width] || '100%';
    var imgTag = '<img src="' + esc(src) + '" alt="' + esc(b.alt||'') + '" style="max-width:' + maxW + ';border-radius:' + (b.borderRadius||12) + 'px;display:inline-block">';
    return '<div style="padding:16px 40px;text-align:' + esc(b.alignment||'center') + '">'
      + (b.linkUrl ? '<a href="' + esc(b.linkUrl) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;max-width:' + maxW + '">' + imgTag + '</a>' : imgTag)
      + (b.caption ? '<p style="font-family:' + t.fontBody + ';font-size:12px;color:' + t.muted + ';margin:8px 0 0;text-align:center">' + esc(b.caption) + '</p>' : '')
      + '</div>';
  }

  function renderText(b, t) {
    var maxWidthMap = {full:'100%',reading:'720px',narrow:'560px'};
    return '<div style="padding:16px 40px"><div style="font-family:' + t.fontBody + ';color:' + t.text + ';line-height:1.7;max-width:' + (maxWidthMap[b.maxWidth]||'100%') + ';margin:0 auto;text-align:' + esc(b.alignment||'left') + ';font-size:15px">' + (b.html||'') + '</div></div>';
  }

  function renderHtmlEmbed(b, t) {
    return '<div style="padding:16px 40px">' + (b.label ? '<div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:' + t.muted + ';margin-bottom:8px">💻 ' + esc(b.label) + '</div>' : '') + '<div>' + (b.html||'') + '</div></div>';
  }

  function renderPromptMasterclass(b, t) {
    return '<div style="padding:28px 40px">'
      + '<div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:8px">🤖 Prompt Like a Rockstar</div>'
      + '<h2 style="font-family:' + t.fontDisplay + ';font-size:26px;color:' + t.text + ';margin:0 0 6px;font-weight:400">' + esc(b.heading||'') + '</h2>'
      + '<div style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.muted + ';margin-bottom:20px">' + esc(b.step||'') + ' · Framework: <strong>' + esc(b.framework||'') + '</strong></div>'
      + '<div class="nap-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px">'
      + '<div style="border:1px solid #f5c6c0;border-radius:12px;padding:16px;background:#FEF0EE"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C0392B;margin-bottom:8px">❌ Bad Prompt</div><p style="font-family:' + t.fontBody + ';font-size:14px;font-style:italic;color:#7A1E12;margin:0;line-height:1.55">' + esc(b.badPrompt||'') + '</p></div>'
      + '<div style="border:1px solid ' + t.accent + '44;border-radius:12px;padding:16px;background:' + t.accent + '0D"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:8px">✓ Good Prompt</div><p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.text + ';margin:0;line-height:1.55">' + esc(b.goodPrompt||'') + '</p></div>'
      + '</div>'
      + '<div style="padding:12px 16px;background:' + t.background + ';border-radius:10px;border-left:3px solid ' + t.accent + '"><p style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.muted + ';margin:0;line-height:1.6"><strong>Why this matters:</strong> ' + esc(b.explanation||'') + '</p></div>'
      + '</div>';
  }

  function renderSbarPrompt(b, t) {
    var colors = [t.primary, t.secondary, t.accent, '#7B2D8B', '#00A651'];
    var stepsHtml = (b.steps||[]).map(function(step, i) {
      var c = colors[i] || t.primary;
      return '<div style="border:1px solid ' + t.border + ';border-radius:10px;padding:14px;background:' + t.surface + '">'
        + '<div class="nap-sbar-letter" style="font-family:' + t.fontDisplay + ';color:' + c + ';">' + esc((step.letter||'').toUpperCase()) + '</div>'
        + '<div style="font-family:' + t.fontMono + ';font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:' + t.muted + ';margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid ' + c + '">' + esc(step.name||'') + '</div>'
        + '<p style="font-family:' + t.fontBody + ';font-size:12px;color:' + t.text + ';margin:0 0 10px;line-height:1.5">' + esc(step.description||'') + '</p>'
        + '<div style="background:' + t.background + ';border-radius:6px;padding:8px 10px;border-left:3px solid ' + c + '"><p style="font-family:' + t.fontBody + ';font-size:11px;color:' + t.muted + ';margin:0;font-style:italic;line-height:1.45">' + esc(step.example||'') + '</p></div>'
        + '</div>';
    }).join('');
    return '<div style="padding:28px 40px">'
      + '<div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:8px">📋 Clinical AI Prompting</div>'
      + '<h2 style="font-family:' + t.fontDisplay + ';font-size:26px;color:' + t.text + ';margin:0 0 20px;font-weight:400">' + esc(b.heading||'') + '</h2>'
      + '<div class="nap-5col" style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">' + stepsHtml + '</div>'
      + '</div>';
  }

  function renderPromptTemplate(b, t) {
    var prompt = String(b.prompt||'');
    var heading = String(b.heading||'Template Prompt');
    return '<div style="padding:18px 40px">'
      + '<details style="border:1px solid ' + t.border + ';border-radius:12px;overflow:hidden;background:' + t.surface + '">'
      + '<summary style="list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;user-select:none">'
      + '<div style="display:flex;flex-direction:column;gap:2px"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:' + t.accent + '">🧩 Template Prompt</div><div style="font-family:' + t.fontDisplay + ';font-size:18px;color:' + t.text + ';font-weight:500">' + esc(heading) + '</div></div>'
      + '<button class="nap-copy-btn" data-copy="' + esc(prompt) + '" style="padding:7px 12px;background:' + t.primary + ';border:none;border-radius:8px;font-family:' + t.fontBody + ';font-size:12px;color:#fff;cursor:pointer;white-space:nowrap">📋 Copy</button>'
      + '</summary>'
      + '<div style="padding:12px 14px;background:' + t.background + ';border-top:1px solid ' + t.border + '"><pre style="font-family:' + t.fontMono + ';font-size:12px;color:' + t.text + ';margin:0;white-space:pre-wrap;line-height:1.6">' + esc(prompt) + '</pre></div>'
      + '</details></div>';
  }

  function renderSafetyReminders(b, t) {
    var items = (b.items||[]).filter(Boolean);
    if (!items.length) return '';
    var gridCols = items.length <= 2 ? '1fr' : '1fr 1fr';
    return '<div style="padding:10px 40px 18px">'
      + '<div style="background:#FFF7E6;border:1px solid #F4D38B;border-radius:12px;padding:14px">'
      + '<div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8A5A00;margin-bottom:10px">⚠️ ' + esc(b.heading||'Safety Reminders') + '</div>'
      + '<div style="display:grid;grid-template-columns:' + gridCols + ';gap:10px">'
      + items.map(function(txt){ return '<div style="background:rgba(255,255,255,0.65);border:1px solid ' + t.border + ';border-radius:10px;padding:12px;display:flex;gap:10px"><div style="font-family:' + t.fontMono + ';font-size:11px;color:#8A5A00;margin-top:1px">▶</div><div style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.text + ';line-height:1.6">' + esc(txt) + '</div></div>'; }).join('')
      + '</div></div></div>';
  }

  function renderClinicalPromptTemplates(b, t) {
    var categoryColors = {'Differential Diagnosis':t.primary,'Discharge Summary':t.secondary,'Literature Review':t.accent,'Patient Education':'#00A651','EEG / EMG Report':'#7B2D8B','Research':'#F47920'};
    var templatesHtml = (b.templates||[]).map(function(tpl) {
      var catColor = categoryColors[tpl.category] || t.primary;
      var tplId = 'tpl-' + esc(String(tpl.id||Math.random().toString(36).slice(2)));
      return '<div style="border:1px solid ' + t.border + ';border-radius:10px;overflow:hidden;background:' + t.surface + '">'
        + '<div style="padding:12px 14px"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">'
        + '<div style="flex:1"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="font-family:' + t.fontMono + ';font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#fff;padding:2px 7px;background:' + catColor + ';border-radius:999px">' + esc(tpl.category) + '</span></div><div style="font-family:' + t.fontBody + ';font-size:13px;font-weight:600;color:' + t.text + ';margin-bottom:3px">' + esc(tpl.title) + '</div><div style="font-family:' + t.fontBody + ';font-size:11px;color:' + t.muted + '">' + esc(tpl.useCase) + '</div></div>'
        + '<div style="display:flex;gap:4px;flex-shrink:0"><button class="nap-expand-btn" data-target="' + tplId + '" style="padding:5px 8px;background:none;border:1px solid ' + t.border + ';border-radius:6px;font-family:' + t.fontBody + ';font-size:11px;color:' + t.muted + '">Preview</button><button class="nap-copy-btn" data-copy="' + esc(tpl.prompt) + '" style="padding:5px 10px;background:' + t.primary + ';border:none;border-radius:6px;font-family:' + t.fontBody + ';font-size:11px;color:#fff">📋 Copy</button></div>'
        + '</div></div>'
        + '<div id="' + tplId + '" class="nap-tpl-prompt" style="background:' + t.background + '"><pre style="font-family:' + t.fontMono + ';font-size:11px;color:' + t.text + ';margin:0;white-space:pre-wrap;line-height:1.6">' + esc(tpl.prompt) + '</pre></div>'
        + '</div>';
    }).join('');
    return '<div style="padding:28px 40px">'
      + '<div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:8px">📎 Ready-to-Use Prompts</div>'
      + '<h2 style="font-family:' + t.fontDisplay + ';font-size:26px;color:' + t.text + ';margin:0 0 6px;font-weight:400">' + esc(b.heading||'') + '</h2>'
      + '<p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.muted + ';margin:0 0 20px">' + esc(b.description||'') + '</p>'
      + '<div class="nap-2col" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">' + templatesHtml + '</div>'
      + '</div>';
  }

  function renderTermOfMonth(b, t) {
    var sections = [{title:'Definition',content:b.definition},{title:'Relevance to Medicine',content:b.relevance},{title:'Clinical Application',content:b.clinicalApplication}];
    var terms = normalizeTerms(b.relatedTerms);
    return '<div style="padding:28px 40px">'
      + '<div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:8px">📖 AI Term of the Month</div>'
      + '<h2 style="font-family:' + t.fontDisplay + ';font-size:34px;color:' + t.text + ';margin:0 0 20px;font-weight:400">' + esc(b.term||'') + '</h2>'
      + '<div class="nap-3col" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">'
      + sections.map(function(s){ return '<div style="border:1px solid ' + t.border + ';border-radius:10px;padding:16px;background:' + t.surface + '"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:' + t.muted + ';margin-bottom:8px">' + esc(s.title) + '</div><p style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.text + ';margin:0;line-height:1.6">' + esc(s.content||'') + '</p></div>'; }).join('')
      + '</div>'
      + (terms.length ? '<div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center"><strong style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.text + ';font-weight:700">Related:</strong>' + terms.map(function(term){ return '<span class="ai-related-pill">' + esc(term) + '</span>'; }).join('') + '</div>' : '')
      + '</div>';
  }

  function renderAiCaseFile(b, t) {
    var imgSrc = b.imageDataUrl || b.imageUrl;
    return '<div style="padding:28px 40px"><div style="display:flex;gap:24px;align-items:flex-start">'
      + '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0"><div style="background:' + t.primary + ';border-radius:10px;padding:14px 18px;text-align:center;color:#fff !important"><div style="font-family:' + t.fontDisplay + ';font-size:28px;color:#fff !important;line-height:1">' + esc(b.year||'') + '</div><div style="font-family:' + t.fontMono + ';font-size:10px;color:rgba(255,255,255,0.92) !important;letter-spacing:0.12em;text-transform:uppercase;margin-top:4px">AI Case File</div></div>'
      + (imgSrc ? '<div style="width:100px;height:80px;border-radius:8px;overflow:hidden;border:1px solid ' + t.border + '"><img src="' + esc(imgSrc) + '" alt="' + esc(b.title||'') + '" style="width:100%;height:100%;object-fit:cover"></div>' : '')
      + '</div>'
      + '<div style="flex:1"><h3 style="font-family:' + t.fontDisplay + ';font-size:22px;color:' + t.text + ';margin:0 0 10px;font-weight:400">' + esc(b.title||'') + '</h3><p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.muted + ';margin:0 0 12px;line-height:1.65">' + esc(b.content||'') + '</p>'
      + (b.significance ? '<div style="background:' + t.background + ';border-radius:8px;padding:10px 14px;border-left:3px solid ' + t.accent + ';margin-bottom:12px"><p style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.muted + ';margin:0;line-height:1.55"><strong>Significance:</strong> ' + esc(b.significance) + '</p></div>' : '')
      + ((b.sourceUrl||b.sourceLabel) ? '<div style="font-family:' + t.fontMono + ';font-size:11px;color:' + t.muted + '">Source: ' + (b.sourceUrl ? '<a href="' + esc(b.sourceUrl) + '" target="_blank" rel="noopener noreferrer" style="color:' + t.accent + '">' + esc(b.sourceLabel||b.sourceUrl) + '</a>' : esc(b.sourceLabel)) + '</div>' : '')
      + '</div></div></div>';
  }

  function renderQuickHits(b, t) {
    var hits = (b.hits||[]).map(function(hit, i) {
      var titleHtml = hit.url ? '<a href="' + esc(hit.url) + '" target="_blank" rel="noopener noreferrer" style="color:' + t.text + ';text-decoration:none">' + esc(hit.title||'') + '</a>' : esc(hit.title||'');
      return '<div style="display:flex;gap:14px;align-items:flex-start;padding:12px 14px;border:1px solid ' + t.border + ';border-radius:10px;background:' + t.surface + '">'
        + '<span style="font-family:' + t.fontMono + ';font-size:18px;color:' + t.accent + ';line-height:1;flex-shrink:0;min-width:28px">' + String(i+1).padStart(2,'0') + '</span>'
        + '<div style="flex:1"><div style="font-family:' + t.fontBody + ';font-size:14px;font-weight:600;color:' + t.text + ';margin-bottom:4px;line-height:1.3">' + titleHtml + '</div><div style="font-family:' + t.fontMono + ';font-size:10px;color:' + t.muted + ';letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(hit.source||'') + '</div>' + (hit.summary ? '<p style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.muted + ';margin:0;line-height:1.5">' + esc(hit.summary) + '</p>' : '') + '</div>'
        + (hit.url ? '<a href="' + esc(hit.url) + '" target="_blank" rel="noopener noreferrer" style="flex-shrink:0;font-family:' + t.fontBody + ';font-size:11px;color:' + t.accent + ';font-weight:600;text-decoration:none">Read →</a>' : '')
        + '</div>';
    }).join('');
    return '<div style="padding:24px 40px"><h2 style="font-family:' + t.fontDisplay + ';font-size:26px;color:' + t.text + ';margin:0 0 16px;font-weight:400">⚡ ' + esc(b.heading||'') + '</h2><div style="display:flex;flex-direction:column;gap:10px">' + hits + '</div></div>';
  }

  function renderHumor(b, t) {
    var imgSrc = b.imageDataUrl || b.imageUrl;
    var imgFit = b.imageFit || 'contain';
    var imgHeight = b.imageHeight;
    var imgStyle = imgHeight ? 'width:100%;height:' + imgHeight + 'px;object-fit:' + imgFit + ';display:block' : 'width:100%;height:auto;display:block';
    return '<div style="padding:28px 40px">'
      + '<div style="background:linear-gradient(135deg,' + t.background + ',' + t.surface + ');border:1px solid ' + t.border + ';border-radius:16px;overflow:hidden">'
      + '<div style="padding:16px 18px;border-bottom:1px solid ' + t.border + ';display:flex;align-items:center;gap:10px"><span style="font-size:18px">😄</span><div style="font-family:' + t.fontDisplay + ';font-size:20px;color:' + t.text + ';font-weight:400">' + esc(b.heading||'Humor') + '</div></div>'
      + (imgSrc ? '<img src="' + esc(imgSrc) + '" alt="" style="' + imgStyle + '">' : '')
      + '<div style="padding:18px 22px;text-align:center">'
      + (!imgSrc ? '<div style="font-size:44px;margin-bottom:10px">' + esc(b.emojiDecor||'😄') + '</div>' : '')
      + (b.attribution ? '<div style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.muted + ';margin-bottom:10px">' + esc(b.attribution) + '</div>' : '')
      + '<div style="font-family:' + t.fontBody + ';font-size:16px;color:' + t.text + ';font-style:italic;line-height:1.65;max-width:760px;margin:0 auto">' + esc(b.content||'') + '</div>'
      + (b.sourceUrl ? '<div style="margin-top:10px"><a href="' + esc(b.sourceUrl) + '" target="_blank" rel="noopener noreferrer" style="font-family:' + t.fontBody + ';font-size:12px;color:' + t.accent + ';text-decoration:none">Source ↗</a></div>' : '')
      + '</div></div></div>';
  }

  function renderSpacer(b, t) {
    return '<div style="height:' + (b.height||24) + 'px;' + (b.showLine ? 'border-top:1px ' + esc(b.lineStyle||'solid') + ' ' + t.border + ';margin:0 40px' : '') + '"></div>';
  }

  function renderAiSafety(b, t) {
    var severityConfig = {
      critical:      {color:'#C0392B',bg:'#FEF0EE',border:'#f5c6c0',label:'CRITICAL',icon:'🔴'},
      high:          {color:'#C06500',bg:'#FFF4E6',border:'#F6D860',label:'HIGH',icon:'🟠'},
      medium:        {color:'#0057A8',bg:'#EEF4FF',border:'#C8D9EE',label:'MEDIUM',icon:'🔵'},
      informational: {color:'#005F6B',bg:'#F0FAFA',border:'#B2E0E4',label:'INFO',icon:'⚪'},
    };
    var updatesHtml = (b.updates||[]).map(function(u) {
      var sev = severityConfig[u.severity] || severityConfig.informational;
      var titleHtml = u.url ? '<a href="' + esc(u.url) + '" target="_blank" rel="noopener noreferrer" style="color:' + t.text + ';text-decoration:none">' + esc(u.title||'') + '</a>' : esc(u.title||'');
      return '<div style="border:1px solid ' + sev.border + ';border-radius:10px;background:' + sev.bg + '">'
        + '<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px">'
        + '<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:2px"><span style="font-size:14px">' + sev.icon + '</span><span style="font-family:' + t.fontMono + ';font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:' + sev.color + ';font-weight:700">' + sev.label + '</span></div>'
        + '<div style="flex:1"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap"><span style="font-family:' + t.fontMono + ';font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:' + sev.color + ';padding:2px 7px;background:' + sev.color + '18;border-radius:999px">' + esc(u.category||'') + '</span><span style="font-family:' + t.fontMono + ';font-size:10px;color:' + t.muted + '">' + esc(u.date||'') + '</span></div>'
        + '<div style="font-family:' + t.fontBody + ';font-size:14px;font-weight:600;color:' + t.text + ';margin-bottom:4px">' + titleHtml + '</div>'
        + '<p style="font-family:' + t.fontBody + ';font-size:13px;color:' + t.muted + ';margin:0;line-height:1.55">' + esc(u.summary||'') + '</p>'
        + (u.url ? '<a href="' + esc(u.url) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-family:' + t.fontBody + ';font-size:11px;color:' + sev.color + ';font-weight:600">View full guidance →</a>' : '')
        + '</div></div></div>';
    }).join('');
    return '<div style="padding:28px 40px">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px"><div><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:18px">🛡️</span><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#C0392B">AI Safety Monitor</div></div><h2 style="font-family:' + t.fontDisplay + ';font-size:26px;color:' + t.text + ';margin:0 0 4px;font-weight:400">' + esc(b.heading||'') + '</h2><p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.muted + ';margin:0">' + esc(b.subheading||'') + '</p></div>'
      + (b.showLastUpdated ? '<div style="font-family:' + t.fontMono + ';font-size:10px;color:' + t.muted + ';text-align:right;line-height:1.4">Last updated<br>' + new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) + '</div>' : '')
      + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:12px">' + updatesHtml + '</div>'
      + '</div>';
  }

  function renderInstitutionalSpotlight(b, t) {
    var items = (b.items||[]).slice(0, b.maxItems||6).map(function(item) {
      return '<div style="border:1px solid ' + t.border + ';border-radius:10px;overflow:hidden;background:' + t.surface + ';display:flex;flex-direction:column">'
        + (item.imageUrl ? '<div style="height:120px;overflow:hidden"><img src="' + esc(item.imageUrl) + '" alt="' + esc(item.title) + '" style="width:100%;height:100%;object-fit:cover"></div>' : '')
        + '<div style="padding:14px;flex:1;display:flex;flex-direction:column">'
        + (item.category ? '<span style="font-family:' + t.fontMono + ';font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:6px;display:block">' + esc(item.category) + '</span>' : '')
        + '<div style="font-family:' + t.fontBody + ';font-size:13px;font-weight:600;color:' + t.text + ';margin-bottom:6px;line-height:1.35;flex:1">' + (item.url ? '<a href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer" style="color:' + t.text + ';text-decoration:none">' + esc(item.title) + '</a>' : esc(item.title)) + '</div>'
        + (item.summary ? '<p style="font-family:' + t.fontBody + ';font-size:12px;color:' + t.muted + ';margin:0 0 8px;line-height:1.5">' + esc(item.summary) + '</p>' : '')
        + (item.url ? '<a href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer" style="margin-top:8px;font-family:' + t.fontBody + ';font-size:11px;color:' + t.accent + ';font-weight:600;text-decoration:none">Read more →</a>' : '')
        + '</div></div>';
    }).join('');
    return '<div style="padding:28px 40px">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="width:28px;height:28px;background:' + t.primary + ';border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:14px">🏥</span></div><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:' + t.primary + '">' + esc(b.institutionLabel||'Your Institution') + '</div></div>'
      + '<h2 style="font-family:' + t.fontDisplay + ';font-size:26px;color:' + t.text + ';margin:0 0 4px;font-weight:400">' + esc(b.heading||'') + '</h2>'
      + (b.subheading ? '<p style="font-family:' + t.fontBody + ';font-size:14px;color:' + t.muted + ';margin:0 0 20px">' + esc(b.subheading) + '</p>' : '')
      + '<div class="nap-3col" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">' + items + '</div>'
      + '</div>';
  }

  function renderRssSidebar(b, t) {
    var urls = (b.feedUrls||[]).filter(Boolean);
    var dataFeeds = esc(JSON.stringify(urls));
    var max = typeof b.maxItems === 'number' ? b.maxItems : 10;
    var safeMax = Math.min(50, Math.max(1, max));
    var itemsHtml = (b.items||[]).slice(0, safeMax).map(function(item, i) {
      return '<div style="padding:11px 18px;border-bottom:1px solid ' + t.border + ';display:flex;gap:10px;align-items:flex-start">'
        + '<span style="font-family:' + t.fontMono + ';font-size:12px;color:' + t.accent + ';flex-shrink:0;min-width:20px;margin-top:1px">' + String(i+1).padStart(2,'0') + '</span>'
        + '<div style="flex:1"><div style="font-family:' + t.fontBody + ';font-size:13px;font-weight:600;color:' + t.text + ';line-height:1.3;margin-bottom:3px">' + (item.url ? '<a href="' + esc(item.url) + '" target="_blank" rel="noopener" style="color:' + t.text + ';text-decoration:none">' + esc(item.title||'') + '</a>' : esc(item.title||'')) + '</div>'
        + '<div style="display:flex;gap:8px;align-items:center">' + (item.source ? '<span style="font-family:' + t.fontMono + ';font-size:9px;color:' + t.muted + ';text-transform:uppercase;letter-spacing:0.08em">' + esc(item.source) + '</span>' : '') + (item.pubDate ? '<span style="font-family:' + t.fontMono + ';font-size:9px;color:' + t.muted + '">' + new Date(item.pubDate).toLocaleDateString() + '</span>' : '') + '</div>'
        + '</div>'
        + (item.url ? '<a href="' + esc(item.url) + '" target="_blank" rel="noopener" style="flex-shrink:0;font-family:' + t.fontBody + ';font-size:11px;color:' + t.accent + ';font-weight:600;text-decoration:none;padding-top:1px">↗</a>' : '')
        + '</div>';
    }).join('');
    return '<div style="padding:24px 40px">'
      + '<div class="nap-rss-sidebar" data-feeds=\"\" data-max="' + safeMax + '" data-live="0" data-key="' + esc(b.id||(b.heading||'rss')) + '" style="border:1px solid ' + t.border + ';border-radius:12px;overflow:hidden;background:' + t.surface + '">'
      + '<div style="background:' + t.primary + ';padding:12px 18px;display:flex;align-items:center;gap:8px;color:#fff"><span style="font-size:14px">📰</span><span style="font-family:' + t.fontMono + ';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#fff;font-weight:600">' + esc(b.heading||'News') + '</span><span style="margin-left:auto;font-family:' + t.fontMono + ';font-size:9px;color:rgba(255,255,255,0.7)" class="nap-rss-timestamp">' + (b.lastFetched ? 'Updated ' + new Date(b.lastFetched).toLocaleDateString() : 'Snapshot') + '</span></div>'
      + '<div class="nap-rss-scroll"><div class="nap-rss-items">' + (itemsHtml || (!urls.length ? '<div style="padding:24px 18px;text-align:center;color:' + t.muted + ';font-family:' + t.fontBody + ';font-size:13px">No feeds configured.</div>' : '<div style="padding:24px 18px;text-align:center;color:' + t.muted + ';font-family:' + t.fontBody + ';font-size:13px">Enable Live RSS to fetch content.</div>')) + '</div></div>'
      + '</div></div>';
  }

  function renderFooter(b, t) {
    var contactEmail = b.contactEmail || '';
    var contactHref = contactEmail ? 'mailto:' + esc(contactEmail) + '?subject=' + encodeURIComponent('Newsletter Feedback') : '#';
    return '<div class="nap-white-section" style="background:' + t.primary + ';padding:44px 40px 36px;text-align:center;color:#fff">'
      + ((b.nextIssueDate||b.nextIssueTeaser) ? '<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:14px 20px;margin-bottom:28px;display:inline-block"><div style="font-family:' + t.fontMono + ';font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:4px">Next Issue</div><div style="font-family:' + t.fontBody + ';font-size:14px;color:#fff">' + esc(b.nextIssueDate||'') + (b.nextIssueTeaser ? ' · ' + esc(b.nextIssueTeaser) : '') + '</div></div>' : '')
      + '<div style="font-family:' + t.fontDisplay + ';font-size:22px;color:#fff;margin-bottom:4px;font-weight:400">' + esc(b.institution||'') + '</div>'
      + '<div style="font-family:' + t.fontBody + ';font-size:14px;color:rgba(255,255,255,0.85);margin-bottom:4px">' + esc(b.department||'') + '</div>'
      + (b.editors ? '<div style="font-family:' + t.fontBody + ';font-size:13px;color:rgba(255,255,255,0.75);margin-bottom:22px">' + esc(b.editors) + '</div>' : '')
      + '<div style="display:flex;justify-content:center;margin-bottom:22px"><a href="' + esc(contactHref) + '" style="display:inline-flex;align-items:center;gap:10px;font-family:' + t.fontBody + ';font-size:13px;font-weight:700;color:#fff;text-decoration:none;padding:10px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.35);background:rgba(255,255,255,0.10)">Contact Us <span style="opacity:0.8">✉️</span></a></div>'
      + '<div style="height:1px;background:rgba(255,255,255,0.18);max-width:240px;margin:0 auto 18px"></div>'
      + (b.disclaimer ? '<p style="font-family:' + t.fontBody + ';font-size:11px;color:rgba(255,255,255,0.75);margin:0 0 8px;max-width:580px;margin-left:auto;margin-right:auto;line-height:1.6">' + esc(b.disclaimer) + '</p>' : '')
      + '<p style="font-family:' + t.fontMono + ';font-size:10px;color:rgba(255,255,255,0.65);margin:0;letter-spacing:0.1em">© ' + esc(b.copyrightYear||String(new Date().getFullYear())) + ' ' + esc(b.institution||'') + '</p>'
      + '</div>';
  }

  // ── Main render function ─────────────────────────────────────────────────────
  function renderNewsletter(data) {
    var t = data.theme;
    applyThemeCss(t);

    var body = (data.blockOrder || []).map(function(id) {
      var block = data.blocks && data.blocks[id];
      return block ? renderBlock(block, t) : '';
    }).join('\\n');

    var contentEl = document.getElementById('nap-content');
    contentEl.innerHTML = '<div class="nap-export-wrap"><div class="nap-shell">' + body + '</div></div>';
    contentEl.style.display = 'block';
    contentEl.style.animation = 'fadeIn 0.3s ease';

    document.title = (data.meta && data.meta.title) || 'Newsletter';

    // Show toolbar with issue info
    var toolbar = document.getElementById('nap-toolbar');
    var issueTitle = (data.meta && data.meta.title) || '';
    var issueNum = (data.meta && data.meta.issueNumber) ? 'Issue ' + data.meta.issueNumber : '';
    var issueMeta = [issueNum, issueTitle].filter(Boolean).join(' · ');
    if (issueMeta) {
      var metaEl = document.createElement('span');
      metaEl.style.cssText = 'font-family:"DM Mono",monospace;font-size:11px;letter-spacing:0.1em;color:rgba(255,255,255,0.6);padding:0 4px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      metaEl.textContent = issueMeta;
      toolbar.insertBefore(metaEl, toolbar.firstChild);
    }

    // Show toolbar
    document.getElementById('nap-toolbar').style.display = 'flex';

    // Hide loading
    document.getElementById('nap-loading').style.display = 'none';

    // Boot the runtime (RSS, copy buttons, etc.)
    bootRuntime();
  }

  // ── JSON loading ─────────────────────────────────────────────────────────────
  function showError(msg, filename) {
    document.getElementById('nap-loading').style.display = 'none';
    var errorEl = document.getElementById('nap-error');
    errorEl.style.display = 'flex';
    if (msg) document.getElementById('nap-error-msg').textContent = msg;
    if (filename) {
      document.getElementById('nap-error-filename').textContent = filename;
      document.getElementById('nap-error-hint').querySelector('code').textContent = filename;
    }
  }

  async function tryFetch(filename) {
    try {
      var res = await fetch('./' + filename, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function loadNewsletter() {
    // 1) Embedded JSON — works with file:// protocol, no server needed
    if (window.__NEWSLETTER__) {
      renderNewsletter(window.__NEWSLETTER__);
      return;
    }

    // 2) URL param: ?json=newsletter_issue001.json
    var params = new URLSearchParams(window.location.search);
    var paramFile = params.get('json');
    if (paramFile) {
      var data = await tryFetch(paramFile);
      if (data) { renderNewsletter(data); return; }
      showError('Could not fetch: ' + paramFile, paramFile);
      return;
    }

    // 3) Meta tag hint: <meta name="nap-issue-file" content="newsletter_issue001.json">
    var metaTag = document.querySelector('meta[name="nap-issue-file"]');
    var metaFile = metaTag && metaTag.getAttribute('content');
    if (metaFile) {
      var data2 = await tryFetch(metaFile);
      if (data2) { renderNewsletter(data2); return; }
    }

    // 4) Auto-detect: try common filenames
    var candidates = [];
    for (var i = 1; i <= 10; i++) {
      candidates.push('newsletter_issue' + String(i).padStart(3,'0') + '.json');
      candidates.push('newsletter_issue' + i + '.json');
    }
    candidates.push('newsletter.json');
    for (var j = 0; j < candidates.length; j++) {
      var d = await tryFetch(candidates[j]);
      if (d && d.blocks) { renderNewsletter(d); return; }
    }

    // 5) Nothing found — show error with drop/browse UI
    var hint = metaFile || 'newsletter_issue001.json';
    showError(
      'Place the JSON file in the same folder and open via a local server, or drag & drop it here.',
      hint
    );
  }

  // ── Drag & drop + file browse ─────────────────────────────────────────────────
  function loadFromFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        document.getElementById('nap-error').style.display = 'none';
        renderNewsletter(data);
      } catch (err) {
        showError('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  document.addEventListener('dragover', function(e) {
    e.preventDefault();
    document.getElementById('nap-drop-overlay').style.display = 'flex';
  });
  document.addEventListener('dragleave', function(e) {
    if (!e.relatedTarget) document.getElementById('nap-drop-overlay').style.display = 'none';
  });
  document.addEventListener('drop', function(e) {
    e.preventDefault();
    document.getElementById('nap-drop-overlay').style.display = 'none';
    var file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) loadFromFile(file);
  });

  // Error page browse button
  var fileInput = document.getElementById('nap-file-input');
  if (fileInput) fileInput.addEventListener('change', function() {
    if (this.files[0]) loadFromFile(this.files[0]);
  });

  // Toolbar buttons
  var toolbarFile = document.getElementById('nap-toolbar-file');
  document.getElementById('btn-load-file').addEventListener('click', function() {
    toolbarFile.click();
  });
  toolbarFile.addEventListener('change', function() {
    if (this.files[0]) loadFromFile(this.files[0]);
  });
  document.getElementById('btn-print').addEventListener('click', function() {
    window.print();
  });

  // ── Runtime (RSS, copy, expand) ───────────────────────────────────────────────
  // This is the same runtime from export.ts, extracted verbatim and called after render.
  function bootRuntime() {
    // Inline the full runtime script here — same as runtimeScript() in export.ts
    // (Injected as a string eval to keep separation clean)
    var s = document.createElement('script');
    s.textContent = RUNTIME_SCRIPT;
    document.body.appendChild(s);
  }

  // Start loading
  loadNewsletter();

})();
</script>

<!-- Runtime script (RSS feeds, copy buttons, expand toggles) -->
<!-- This is injected after renderNewsletter() completes via bootRuntime() -->
<script id="nap-runtime-src" type="text/nap-runtime">
RUNTIME_PLACEHOLDER
</script>
<script>
// Wire the runtime script text for bootRuntime()
var RUNTIME_SCRIPT = document.getElementById('nap-runtime-src').textContent;
</script>

</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Downloads newsletter_viewer.html — a standalone viewer shell.
 *
 * mode 'embedded': embeds the JSON directly (works on file://, no server needed)
 * mode 'sidecar':  viewer only, expects newsletter_issue{N}.json in same folder
 */
export function downloadViewer(
  newsletter: Newsletter,
  mode: 'embedded' | 'sidecar' = 'sidecar'
): void {
  const issueFilename = newsletterJsonFilename(newsletter);
  const embeddedJson = mode === 'embedded'
    ? JSON.stringify(newsletter)
    : null;

  let html = buildViewerHtml(embeddedJson, issueFilename);

  // Inject the runtime script — use the shared RUNTIME_JS constant directly.
  // This is the single source of truth: no regex extraction, no fragile parsing.
  const safeRuntime = RUNTIME_JS.replace(/<\/script>/g, '<\\/script>');
  html = html.replace('RUNTIME_PLACEHOLDER', safeRuntime);

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'index.html';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads both the viewer shell AND the JSON sidecar in one click.
 * This is the recommended workflow — drops both files ready to use together.
 */
export function downloadViewerBundle(newsletter: Newsletter): void {
  // Download JSON sidecar first
  downloadJson(newsletter);
  // Small delay so browser doesn't block two simultaneous downloads
  setTimeout(() => downloadViewer(newsletter, 'sidecar'), 400);
}

/**
 * Downloads the viewer with JSON embedded — single self-contained file.
 * Works on file:// protocol (double-click to open).
 */
export function downloadViewerEmbedded(newsletter: Newsletter): void {
  downloadViewer(newsletter, 'embedded');
}