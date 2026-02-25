import type { Newsletter } from '../types';

/**
 * EMAIL EXPORT
 *
 * Rules:
 *  - No CSS custom properties (var()) — all values must be resolved literals
 *  - No CSS Grid — multi-column uses <table> for Outlook
 *  - No Flexbox in structural layout (ok for small decorative elements)
 *  - All styles must be inline (Gmail strips <style> blocks in <head>)
 *  - No JavaScript
 *  - Max width 600px (standard email width)
 *  - Web fonts declared via <link> with fallback stack (Gmail supports Google Fonts)
 *  - Images always have alt text and explicit dimensions where known
 *  - Background colours on <td> not <div> for Outlook
 */

function esc(str: string): string {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Inline CSS resolver ───────────────────────────────────────────────────────
// Takes a theme and returns a function that resolves common style patterns
// to inline-safe strings (no var(), no calc() with variables)

function makeStyles(t: Newsletter['theme']) {
  return {
    // Typography
    fontDisplay: t.fontDisplay.replace(/var\([^)]+\)/g, 'Georgia, serif'),
    fontBody: t.fontBody.replace(/var\([^)]+\)/g, 'system-ui, Arial, sans-serif'),
    fontMono: t.fontMono.replace(/var\([^)]+\)/g, 'ui-monospace, Courier New, monospace'),
    // Colors
    primary: t.primary,
    secondary: t.secondary,
    accent: t.accent,
    bg: t.background,
    surface: t.surface,
    border: t.border,
    text: t.text,
    muted: t.muted,
  };
}

// ─── Block email renderers ─────────────────────────────────────────────────────

function emailHeader(b: any, s: ReturnType<typeof makeStyles>): string {
  const bg = b.backgroundStyle === 'solid' ? s.primary : s.primary;
  return `
<tr><td bgcolor="${bg}" align="center" style="background:${bg};padding:40px 32px;text-align:center">
  ${(b.logoDataUrl || b.logoUrl) ? `<img src="${esc(b.logoDataUrl || b.logoUrl)}" alt="Logo" width="160" style="max-width:160px;margin-bottom:16px;border-radius:6px;display:block;margin-left:auto;margin-right:auto">` : ''}
  <p style="font-family:${s.fontMono};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin:0 0 10px">${esc(b.issueNumber)} · ${esc(b.issueDate)}</p>
  <h1 style="font-family:${s.fontDisplay};font-size:38px;font-weight:400;color:#ffffff;margin:0 0 10px;line-height:1.1">${esc(b.title)}</h1>
  <p style="font-family:${s.fontDisplay};font-size:18px;font-style:italic;color:rgba(255,255,255,0.9);margin:0 0 16px;line-height:1.3">${esc(b.subtitle)}</p>
  <p style="font-family:${s.fontBody};font-size:13px;color:rgba(255,255,255,0.8);margin:0">${esc(b.tagline)}</p>
</td></tr>`;
}

function emailTicker(b: any, s: ReturnType<typeof makeStyles>): string {
  const bg = b.backgroundColor || s.primary;
  const textColor = b.textColor || '#ffffff';
  const items: string[] = b.items || [];
  if (!items.length) return '';
  return `
<tr><td bgcolor="${bg}" style="background:${bg};padding:10px 24px">
  <p style="font-family:${s.fontMono};font-size:11px;color:${textColor};margin:0;letter-spacing:0.06em;line-height:1.6">
    ${items.map(i => `◆ ${esc(i)}`).join('&nbsp;&nbsp;&nbsp;')}
  </p>
</td></tr>`;
}

function emailSectionDivider(b: any, s: ReturnType<typeof makeStyles>): string {
  if (b.style === 'bold') {
    return `
<tr><td bgcolor="${s.primary}" style="background:${s.primary};padding:14px 32px">
  <p style="font-family:${s.fontMono};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin:0">
    ${b.number > 0 ? `0${b.number} — ` : ''}${esc(b.label)}
  </p>
</td></tr>`;
  }
  return `
<tr><td style="padding:28px 32px 12px">
  <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${s.muted};margin:0 0 8px">
    ${b.number > 0 ? `0${b.number} — ` : ''}${esc(b.label)}
  </p>
  <hr style="border:none;border-top:1px solid ${s.border};margin:0">
  ${b.description ? `<p style="font-family:${s.fontBody};font-size:13px;color:${s.muted};margin:8px 0 0;line-height:1.5">${esc(b.description)}</p>` : ''}
</td></tr>`;
}

function emailArticle(art: any, s: ReturnType<typeof makeStyles>): string {
  const evidenceColors: Record<string, string> = {
    High: '#00A651', Moderate: '#F47920', Low: '#C0392B', 'Expert Opinion': '#7B2D8B',
  };
  const ec = art.evidenceLevel ? evidenceColors[art.evidenceLevel] : null;
  const titleHtml = art.url
    ? `<a href="${esc(art.url)}" style="color:${s.text};text-decoration:none;font-family:${s.fontDisplay};font-size:18px;font-weight:400;line-height:1.3">${esc(art.title)}</a>`
    : `<span style="font-family:${s.fontDisplay};font-size:18px;color:${s.text};line-height:1.3">${esc(art.title)}</span>`;

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${s.border};border-radius:10px;overflow:hidden;margin-bottom:16px">
  ${art.imageUrl ? `<tr><td><img src="${esc(art.imageUrl)}" alt="${esc(art.title)}" width="100%" style="width:100%;max-height:200px;object-fit:cover;display:block"></td></tr>` : ''}
  <tr><td style="padding:16px;background:${s.surface}">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px">
      <tr>
        <td><span style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${s.muted}">${esc(art.source || '')}</span></td>
        ${ec ? `<td align="right"><span style="background:${ec}22;color:${ec};border:1px solid ${ec}44;border-radius:999px;padding:2px 8px;font-family:${s.fontMono};font-size:10px">${esc(art.evidenceLevel)}</span></td>` : ''}
      </tr>
    </table>
    <div style="margin-bottom:10px">${titleHtml}</div>
    ${art.summary ? `<p style="font-family:${s.fontBody};font-size:13px;color:${s.muted};margin:0 0 10px;line-height:1.6">${esc(art.summary)}</p>` : ''}
    ${art.myTake ? `<p style="font-family:${s.fontBody};font-size:13px;font-style:italic;color:${s.secondary};margin:0 0 10px;padding-left:10px;border-left:3px solid ${s.accent};line-height:1.5">${esc(art.myTake)}</p>` : ''}
    ${art.url ? `<a href="${esc(art.url)}" style="display:inline-block;font-family:${s.fontBody};font-size:12px;color:${s.accent};font-weight:600;text-decoration:none">Read full paper →</a>` : ''}
  </td></tr>
</table>`;
}

function emailArticleGrid(b: any, s: ReturnType<typeof makeStyles>): string {
  const articles: any[] = b.articles || [];
  if (!articles.length) return '';
  // Email: always single column (safest cross-client approach)
  // For 2-col we use a table with 2 cells but collapse on narrow viewports
  return `
<tr><td style="padding:20px 32px">
  ${b.sectionTitle ? `<h2 style="font-family:${s.fontDisplay};font-size:22px;color:${s.text};margin:0 0 18px;font-weight:400">${esc(b.sectionTitle)}</h2>` : ''}
  ${articles.map(art => emailArticle(art, s)).join('')}
</td></tr>`;
}

function emailSpotlight(b: any, s: ReturnType<typeof makeStyles>): string {
  const art = b.article || {};
  const accent = b.accentColor || s.accent;
  return `
<tr><td style="padding:20px 32px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${s.border};border-radius:12px;overflow:hidden">
    ${art.imageUrl ? `<tr><td><img src="${esc(art.imageUrl)}" alt="${esc(art.title || '')}" width="100%" style="width:100%;max-height:240px;object-fit:cover;display:block"></td></tr>` : ''}
    <tr><td style="padding:24px;background:${s.surface};border-left:4px solid ${accent}">
      <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${s.muted};margin:0 0 10px">✦ Spotlight · ${esc(art.source || '')}</p>
      <h2 style="font-family:${s.fontDisplay};font-size:24px;color:${s.text};margin:0 0 10px;font-weight:400;line-height:1.2">
        ${art.url ? `<a href="${esc(art.url)}" style="color:${s.text};text-decoration:none">${esc(art.title)}</a>` : esc(art.title)}
      </h2>
      ${art.summary ? `<p style="font-family:${s.fontBody};font-size:14px;color:${s.muted};margin:0 0 12px;line-height:1.6">${esc(art.summary)}</p>` : ''}
      ${art.myTake ? `<p style="font-family:${s.fontBody};font-size:13px;font-style:italic;color:${s.secondary};margin:0 0 14px;border-left:3px solid ${accent};padding-left:10px;line-height:1.5">${esc(art.myTake)}</p>` : ''}
      ${art.url ? `<a href="${esc(art.url)}" style="display:inline-block;padding:9px 18px;background:${accent};color:#fff;border-radius:8px;font-family:${s.fontBody};font-size:13px;font-weight:600;text-decoration:none">Read the paper →</a>` : ''}
    </td></tr>
  </table>
</td></tr>`;
}

function emailText(b: any, s: ReturnType<typeof makeStyles>): string {
  return `
<tr><td style="padding:14px 32px">
  <div style="font-family:${s.fontBody};color:${s.text};line-height:1.7;font-size:15px">${b.html || ''}</div>
</td></tr>`;
}

function emailQuickHits(b: any, s: ReturnType<typeof makeStyles>): string {
  const hits: any[] = b.hits || [];
  return `
<tr><td style="padding:20px 32px">
  <h2 style="font-family:${s.fontDisplay};font-size:22px;color:${s.text};margin:0 0 16px;font-weight:400">${esc(b.heading || 'Quick Hits')}</h2>
  ${hits.map(h => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;border-left:3px solid ${s.accent}">
    <tr><td style="padding:8px 0 8px 14px">
      <p style="font-family:${s.fontBody};font-size:14px;font-weight:600;color:${s.text};margin:0 0 3px">
        ${h.url ? `<a href="${esc(h.url)}" style="color:${s.text};text-decoration:none">${esc(h.title)}</a>` : esc(h.title)}
      </p>
      <p style="font-family:${s.fontMono};font-size:10px;color:${s.muted};margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em">${esc(h.source || '')}</p>
      ${h.summary ? `<p style="font-family:${s.fontBody};font-size:13px;color:${s.muted};margin:0;line-height:1.5">${esc(h.summary)}</p>` : ''}
    </td></tr>
  </table>`).join('')}
</td></tr>`;
}

function emailEthicsSplit(b: any, s: ReturnType<typeof makeStyles>): string {
  return `
<tr><td style="padding:20px 32px">
  <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${s.accent};margin:0 0 6px">⚖ AI Ethics &amp; Governance</p>
  <h2 style="font-family:${s.fontDisplay};font-size:22px;color:${s.text};margin:0 0 16px;font-weight:400">${esc(b.heading || '')}</h2>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px">
    <tr>
      <td width="48%" valign="top" style="padding:16px;background:${s.bg};border:1px solid ${s.border};border-radius:10px">
        <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#C0392B;margin:0 0 8px">${esc(b.leftTitle || '')}</p>
        <p style="font-family:${s.fontBody};font-size:13px;color:${s.text};margin:0;line-height:1.6">${esc(b.leftContent || '')}</p>
      </td>
      <td width="4%"></td>
      <td width="48%" valign="top" style="padding:16px;background:${s.accent}0A;border:1px solid ${s.accent}44;border-radius:10px">
        <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${s.accent};margin:0 0 8px">${esc(b.rightTitle || '')}</p>
        <p style="font-family:${s.fontBody};font-size:13px;color:${s.text};margin:0;line-height:1.6">${esc(b.rightContent || '')}</p>
      </td>
    </tr>
  </table>
  ${b.clinicalPerspective ? `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:12px 16px;border-left:4px solid ${s.accent};background:${s.surface}">
      <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${s.muted};margin:0 0 4px">Clinical Perspective</p>
      <p style="font-family:${s.fontBody};font-size:13px;color:${s.text};margin:0;line-height:1.6">${esc(b.clinicalPerspective)}</p>
    </td></tr>
  </table>` : ''}
</td></tr>`;
}

function emailFooter(b: any, s: ReturnType<typeof makeStyles>): string {
  const contactEmail = b.contactEmail || '';
  return `
<tr><td bgcolor="${s.primary}" align="center" style="background:${s.primary};padding:36px 32px;text-align:center">
  ${(b.nextIssueDate || b.nextIssueTeaser) ? `
  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:20px">
    <tr><td style="padding:10px 18px;background:rgba(255,255,255,0.12);border-radius:8px">
      <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin:0 0 3px">Next Issue</p>
      <p style="font-family:${s.fontBody};font-size:13px;color:#fff;margin:0">${esc(b.nextIssueDate || '')}${b.nextIssueTeaser ? ` · ${esc(b.nextIssueTeaser)}` : ''}</p>
    </td></tr>
  </table>` : ''}
  <h3 style="font-family:${s.fontDisplay};font-size:20px;color:#fff;margin:0 0 4px;font-weight:400">${esc(b.institution || '')}</h3>
  <p style="font-family:${s.fontBody};font-size:13px;color:rgba(255,255,255,0.8);margin:0 0 4px">${esc(b.department || '')}</p>
  ${b.editors ? `<p style="font-family:${s.fontBody};font-size:12px;color:rgba(255,255,255,0.7);margin:0 0 18px">${esc(b.editors)}</p>` : ''}
  ${contactEmail ? `<a href="mailto:${esc(contactEmail)}" style="display:inline-block;padding:9px 16px;border:1px solid rgba(255,255,255,0.35);border-radius:10px;background:rgba(255,255,255,0.10);font-family:${s.fontBody};font-size:13px;color:#fff;text-decoration:none;margin-bottom:20px">Contact Us ✉️</a>` : ''}
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.18);max-width:200px;margin:0 auto 16px">
  ${b.disclaimer ? `<p style="font-family:${s.fontBody};font-size:10px;color:rgba(255,255,255,0.65);margin:0 0 6px;line-height:1.5;max-width:480px;margin-left:auto;margin-right:auto">${esc(b.disclaimer)}</p>` : ''}
  ${b.unsubscribeUrl ? `<p style="margin:0"><a href="${esc(b.unsubscribeUrl)}" style="font-family:${s.fontMono};font-size:10px;color:rgba(255,255,255,0.5);text-decoration:underline">Unsubscribe</a></p>` : ''}
  <p style="font-family:${s.fontMono};font-size:10px;color:rgba(255,255,255,0.5);margin:6px 0 0;letter-spacing:0.08em">© ${esc(b.copyrightYear || String(new Date().getFullYear()))} ${esc(b.institution || '')}</p>
</td></tr>`;
}

function emailSpacer(b: any): string {
  return `<tr><td height="${b.height || 24}" style="font-size:0;line-height:0">&nbsp;</td></tr>`;
}

function emailHumor(b: any, s: ReturnType<typeof makeStyles>): string {
  return `
<tr><td style="padding:20px 32px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${s.bg};border:1px solid ${s.border};border-radius:12px">
    <tr><td style="padding:24px;text-align:center">
      ${b.imageUrl ? `<img src="${esc(b.imageUrl)}" alt="" width="100%" style="max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:16px;display:block">` : ''}
      <p style="font-family:${s.fontDisplay};font-size:22px;color:${s.text};margin:0 0 14px;font-weight:400">${esc(b.heading || '')}</p>
      <p style="font-family:${s.fontBody};font-size:15px;color:${s.text};margin:0 0 10px;line-height:1.6;font-style:italic">${esc(b.content || '')}</p>
      ${b.attribution ? `<p style="font-family:${s.fontMono};font-size:11px;color:${s.muted};margin:0">${esc(b.attribution)}</p>` : ''}
    </td></tr>
  </table>
</td></tr>`;
}

function emailTermOfMonth(b: any, s: ReturnType<typeof makeStyles>): string {
  return `
<tr><td style="padding:20px 32px">
  <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${s.accent};margin:0 0 6px">📖 AI Term of the Month</p>
  <h2 style="font-family:${s.fontDisplay};font-size:28px;color:${s.text};margin:0 0 18px;font-weight:400">${esc(b.term || '')}</h2>
  ${[
    { label: 'Definition', val: b.definition },
    { label: 'Relevance to Practice', val: b.relevance },
    { label: 'Clinical Application', val: b.clinicalApplication },
  ].filter(x => x.val).map(x => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px">
    <tr><td style="padding:14px 16px;border:1px solid ${s.border};border-radius:10px;background:${s.surface}">
      <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${s.muted};margin:0 0 6px">${esc(x.label)}</p>
      <p style="font-family:${s.fontBody};font-size:13px;color:${s.text};margin:0;line-height:1.6">${esc(x.val)}</p>
    </td></tr>
  </table>`).join('')}
</td></tr>`;
}

function emailPromptTemplate(b: any, s: ReturnType<typeof makeStyles>): string {
  const prompt = String(b.prompt || '');
  if (!prompt) return '';
  return `
<tr><td style="padding:14px 32px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${s.border};border-radius:10px;overflow:hidden">
    <tr><td style="padding:12px 16px;background:${s.surface}">
      <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${s.accent};margin:0 0 4px">🧩 Template Prompt</p>
      <p style="font-family:${s.fontDisplay};font-size:16px;color:${s.text};margin:0 0 10px;font-weight:500">${esc(b.heading || 'Prompt Template')}</p>
    </td></tr>
    <tr><td style="padding:14px 16px;background:${s.bg}">
      <pre style="font-family:${s.fontMono};font-size:11px;color:${s.text};margin:0;white-space:pre-wrap;line-height:1.6">${esc(prompt)}</pre>
    </td></tr>
  </table>
</td></tr>`;
}

function emailSafetyReminders(b: any, s: ReturnType<typeof makeStyles>): string {
  const items: string[] = (b.items || []).filter(Boolean);
  if (!items.length) return '';
  return `
<tr><td style="padding:12px 32px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF7E6;border:1px solid #F4D38B;border-radius:10px">
    <tr><td style="padding:14px 16px">
      <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8A5A00;margin:0 0 10px">⚠️ ${esc(b.heading || 'Safety Reminders')}</p>
      ${items.map(txt => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px">
        <tr><td style="padding:10px 12px;background:rgba(255,255,255,0.65);border:1px solid ${s.border};border-radius:8px">
          <p style="font-family:${s.fontBody};font-size:13px;color:${s.text};margin:0;line-height:1.55">▶ ${esc(txt)}</p>
        </td></tr>
      </table>`).join('')}
    </td></tr>
  </table>
</td></tr>`;
}

function emailAiSafety(b: any, s: ReturnType<typeof makeStyles>): string {
  type SevKey = 'critical' | 'high' | 'medium' | 'informational';
  const severityConfig: Record<SevKey, { color: string; bg: string; border: string; label: string; icon: string }> = {
    critical:      { color: '#C0392B', bg: '#FEF0EE', border: '#f5c6c0', label: 'CRITICAL', icon: '🔴' },
    high:          { color: '#C06500', bg: '#FFF4E6', border: '#F6D860', label: 'HIGH',     icon: '🟠' },
    medium:        { color: '#0057A8', bg: '#EEF4FF', border: '#C8D9EE', label: 'MEDIUM',   icon: '🔵' },
    informational: { color: '#005F6B', bg: '#F0FAFA', border: '#B2E0E4', label: 'INFO',     icon: '⚪' },
  };
  const rows = (b.updates || []).map((u: any) => {
    const sev = severityConfig[(u.severity as SevKey)] || severityConfig.informational;
    const titleHtml = u.url
      ? `<a href="${esc(u.url)}" style="color:${s.text};text-decoration:none;font-weight:600">${esc(u.title || '')}</a>`
      : `<span style="font-weight:600">${esc(u.title || '')}</span>`;
    return `
    <tr><td style="padding:10px 14px;background:${sev.bg};border:1px solid ${sev.border};border-radius:8px;margin-bottom:8px">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="28" valign="top" style="padding-right:10px">
            <p style="font-size:14px;margin:0">${sev.icon}</p>
            <p style="font-family:${s.fontMono};font-size:8px;text-transform:uppercase;color:${sev.color};font-weight:700;margin:2px 0 0">${sev.label}</p>
          </td>
          <td valign="top">
            <p style="font-family:${s.fontMono};font-size:9px;text-transform:uppercase;color:${sev.color};margin:0 0 3px">${esc(u.category || '')} · ${esc(u.date || '')}</p>
            <p style="font-family:${s.fontBody};font-size:13px;color:${s.text};margin:0 0 4px">${titleHtml}</p>
            <p style="font-family:${s.fontBody};font-size:12px;color:${s.muted};margin:0;line-height:1.5">${esc(u.summary || '')}</p>
            ${u.url ? `<p style="margin:6px 0 0"><a href="${esc(u.url)}" style="font-family:${s.fontBody};font-size:11px;color:${sev.color};font-weight:600">View guidance →</a></p>` : ''}
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td height="8"></td></tr>`;
  }).join('');
  return `
<tr><td style="padding:20px 32px">
  <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#C0392B;margin:0 0 6px">🛡️ AI Safety Monitor</p>
  <h2 style="font-family:${s.fontDisplay};font-size:22px;color:${s.text};margin:0 0 4px;font-weight:400">${esc(b.heading || '')}</h2>
  <p style="font-family:${s.fontBody};font-size:13px;color:${s.muted};margin:0 0 16px">${esc(b.subheading || '')}</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    ${rows}
  </table>
</td></tr>`;
}

function emailAiCaseFile(b: any, s: ReturnType<typeof makeStyles>): string {
  return `
<tr><td style="padding:20px 32px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${s.border};border-radius:10px;overflow:hidden">
    <tr>
      <td width="90" valign="top" bgcolor="${s.primary}" style="background:${s.primary};padding:16px;text-align:center">
        <p style="font-family:${s.fontDisplay};font-size:24px;color:#fff;margin:0;line-height:1">${esc(b.year || '')}</p>
        <p style="font-family:${s.fontMono};font-size:9px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:0.1em;margin:4px 0 0">AI Case File</p>
      </td>
      <td valign="top" style="padding:16px;background:${s.surface}">
        <h3 style="font-family:${s.fontDisplay};font-size:18px;color:${s.text};margin:0 0 8px;font-weight:400">${esc(b.title || '')}</h3>
        <p style="font-family:${s.fontBody};font-size:13px;color:${s.muted};margin:0 0 8px;line-height:1.55">${esc(b.content || '')}</p>
        ${b.significance ? `<p style="font-family:${s.fontBody};font-size:12px;color:${s.muted};margin:0;border-left:3px solid ${s.accent};padding-left:10px;line-height:1.5"><strong>Significance:</strong> ${esc(b.significance)}</p>` : ''}
        ${b.sourceUrl ? `<p style="margin:8px 0 0"><a href="${esc(b.sourceUrl)}" style="font-family:${s.fontBody};font-size:11px;color:${s.accent};font-weight:600">${esc(b.sourceLabel || 'Source →')}</a></p>` : ''}
      </td>
    </tr>
  </table>
</td></tr>`;
}

function emailInstitutionalSpotlight(b: any, s: ReturnType<typeof makeStyles>): string {
  const items = (b.items || []).slice(0, Math.min(b.maxItems || 6, 6));
  if (!items.length) return '';
  return `
<tr><td style="padding:20px 32px">
  <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${s.primary};margin:0 0 6px">🏥 ${esc(b.institutionLabel || 'Your Institution')}</p>
  <h2 style="font-family:${s.fontDisplay};font-size:22px;color:${s.text};margin:0 0 16px;font-weight:400">${esc(b.heading || '')}</h2>
  ${items.map((item: any) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;border:1px solid ${s.border};border-radius:8px;overflow:hidden">
    <tr><td style="padding:12px 14px;background:${s.surface}">
      ${item.category ? `<p style="font-family:${s.fontMono};font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${s.accent};margin:0 0 4px">${esc(item.category)}</p>` : ''}
      <p style="font-family:${s.fontBody};font-size:13px;font-weight:600;color:${s.text};margin:0 0 4px;line-height:1.35">
        ${item.url ? `<a href="${esc(item.url)}" style="color:${s.text};text-decoration:none">${esc(item.title)}</a>` : esc(item.title)}
      </p>
      ${item.summary ? `<p style="font-family:${s.fontBody};font-size:12px;color:${s.muted};margin:0 0 6px;line-height:1.5">${esc(item.summary)}</p>` : ''}
      ${item.url ? `<a href="${esc(item.url)}" style="font-family:${s.fontBody};font-size:11px;color:${s.accent};font-weight:600;text-decoration:none">Read more →</a>` : ''}
    </td></tr>
  </table>`).join('')}
</td></tr>`;
}

function emailRssSidebar(b: any, s: ReturnType<typeof makeStyles>): string {
  const items = (b.items || []).slice(0, b.maxItems || 10);
  if (!items.length) return '';
  return `
<tr><td style="padding:20px 32px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${s.border};border-radius:10px;overflow:hidden">
    <tr><td bgcolor="${s.primary}" style="background:${s.primary};padding:10px 16px">
      <p style="font-family:${s.fontMono};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#fff;margin:0">📰 ${esc(b.heading || 'News')}</p>
    </td></tr>
    ${items.map((item: any, i: number) => `
    <tr><td style="padding:10px 16px;border-bottom:1px solid ${s.border};background:${s.surface}">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="24" valign="top">
            <p style="font-family:${s.fontMono};font-size:12px;color:${s.accent};margin:0">${String(i + 1).padStart(2, '0')}</p>
          </td>
          <td valign="top">
            <p style="font-family:${s.fontBody};font-size:13px;font-weight:600;color:${s.text};margin:0 0 2px;line-height:1.3">
              ${item.url ? `<a href="${esc(item.url)}" style="color:${s.text};text-decoration:none">${esc(item.title || '')}</a>` : esc(item.title || '')}
            </p>
            <p style="font-family:${s.fontMono};font-size:10px;color:${s.muted};margin:0;text-transform:uppercase">${esc(item.source || '')}</p>
          </td>
          ${item.url ? `<td width="20" valign="top" align="right"><a href="${esc(item.url)}" style="font-family:${s.fontBody};font-size:12px;color:${s.accent};text-decoration:none">↗</a></td>` : ''}
        </tr>
      </table>
    </td></tr>`).join('')}
  </table>
</td></tr>`;
}

function emailPromptMasterclass(b: any, s: ReturnType<typeof makeStyles>): string {
  return `
<tr><td style="padding:20px 32px">
  <p style="font-family:${s.fontMono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${s.accent};margin:0 0 6px">🤖 Prompt Like a Rockstar</p>
  <h2 style="font-family:${s.fontDisplay};font-size:22px;color:${s.text};margin:0 0 4px;font-weight:400">${esc(b.heading || '')}</h2>
  <p style="font-family:${s.fontBody};font-size:13px;color:${s.muted};margin:0 0 16px">${esc(b.step || '')} · ${esc(b.framework || '')}</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px">
    <tr>
      <td width="48%" valign="top" style="padding:14px;background:#FEF0EE;border:1px solid #f5c6c0;border-radius:10px">
        <p style="font-family:${s.fontMono};font-size:10px;text-transform:uppercase;color:#C0392B;margin:0 0 8px">❌ Bad Prompt</p>
        <p style="font-family:${s.fontBody};font-size:13px;font-style:italic;color:#7A1E12;margin:0;line-height:1.5">${esc(b.badPrompt || '')}</p>
      </td>
      <td width="4%"></td>
      <td width="48%" valign="top" style="padding:14px;background:${s.accent}0D;border:1px solid ${s.accent}44;border-radius:10px">
        <p style="font-family:${s.fontMono};font-size:10px;text-transform:uppercase;color:${s.accent};margin:0 0 8px">✓ Good Prompt</p>
        <p style="font-family:${s.fontBody};font-size:13px;color:${s.text};margin:0;line-height:1.5">${esc(b.goodPrompt || '')}</p>
      </td>
    </tr>
  </table>
  ${b.explanation ? `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:12px 16px;background:${s.bg};border-left:3px solid ${s.accent};border-radius:0 8px 8px 0">
      <p style="font-family:${s.fontBody};font-size:13px;color:${s.muted};margin:0;line-height:1.6"><strong>Why this matters:</strong> ${esc(b.explanation)}</p>
    </td></tr>
  </table>` : ''}
</td></tr>`;
}

function emailGenericBlock(s: ReturnType<typeof makeStyles>, label: string): string {
  return `
<tr><td style="padding:12px 32px">
  <p style="font-family:${s.fontMono};font-size:10px;color:${s.muted};text-transform:uppercase;letter-spacing:0.12em;margin:0">[${esc(label)} — view in browser for full rendering]</p>
</td></tr>`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

function blockToEmailRow(block: any, s: ReturnType<typeof makeStyles>): string {
  switch (block.type) {
    case 'header':           return emailHeader(block, s);
    case 'ticker':           return emailTicker(block, s);
    case 'section-divider':  return emailSectionDivider(block, s);
    case 'article-grid':     return emailArticleGrid(block, s);
    case 'spotlight':        return emailSpotlight(block, s);
    case 'ethics-split':     return emailEthicsSplit(block, s);
    case 'text':             return emailText(block, s);
    case 'quick-hits':       return emailQuickHits(block, s);
    case 'humor':            return emailHumor(block, s);
    case 'term-of-month':    return emailTermOfMonth(block, s);
    case 'footer':           return emailFooter(block, s);
    case 'spacer':           return emailSpacer(block);
    case 'image': {
      const src = block.dataUrl || block.url;
      if (!src) return '';
      return `<tr><td style="padding:12px 32px;text-align:${block.alignment || 'center'}"><img src="${esc(src)}" alt="${esc(block.alt || '')}" style="max-width:100%;border-radius:${block.borderRadius || 8}px"></td></tr>`;
    }
    // Blocks that don't translate well to email — show a placeholder
    case 'sbar-prompt':
    case 'clinical-prompt-templates':
      return emailGenericBlock(s, block.type.replace(/-/g, ' '));
    case 'prompt-masterclass':  return emailPromptMasterclass(block, s);
    case 'prompt-template':     return emailPromptTemplate(block, s);
    case 'safety-reminders':    return emailSafetyReminders(block, s);
    case 'ai-case-file':        return emailAiCaseFile(block, s);
    case 'ai-safety':           return emailAiSafety(block, s);
    case 'institutional-spotlight': return emailInstitutionalSpotlight(block, s);
    case 'rss-sidebar':         return emailRssSidebar(block, s);
    case 'html-embed':
      return `<tr><td style="padding:12px 32px">${block.html || ''}</td></tr>`;
    default:
      return '';
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function exportToEmailHtml(newsletter: Newsletter): string {
  const { theme, blocks, blockOrder } = newsletter;
  const s = makeStyles(theme);
  const rows = blockOrder
    .map(id => blocks[id] ? blockToEmailRow(blocks[id], s) : '')
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${esc(newsletter.meta?.title || 'Newsletter')}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background: ${s.bg}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; }
    img { border: 0; outline: none; text-decoration: none; }
    a { color: ${s.accent}; }
    @media only screen and (max-width: 620px) {
      .nap-email-shell { width: 100% !important; }
      .nap-email-col { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${s.bg}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${s.bg};padding:20px 0">
    <tr><td align="center">
      <!-- Email shell: max 600px -->
      <table class="nap-email-shell" width="600" cellpadding="0" cellspacing="0" border="0"
        style="width:600px;max-width:600px;background:${s.surface};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        ${rows}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function downloadEmailHtml(newsletter: Newsletter): void {
  const html = exportToEmailHtml(newsletter);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const num = (newsletter.meta?.issueNumber || 'draft').replace(/\s+/g, '');
  a.download = `newsletter_issue${num}_email.html`;
  a.click();
  URL.revokeObjectURL(url);
}
