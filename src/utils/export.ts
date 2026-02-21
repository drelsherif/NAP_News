import type { Newsletter, Block } from '../types';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function blockToHtml(block: Block, theme: Newsletter['theme']): string {
  const b = block as any;
  switch (block.type) {
    case 'header':
      return `
<div style="background:linear-gradient(135deg,${theme.primary},${theme.secondary});padding:48px 40px;text-align:center;border-radius:0">
  ${b.logoDataUrl ? `<img src="${b.logoDataUrl}" alt="Logo" style="max-height:60px;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto">` : ''}
  <div style="font-family:${theme.fontMono};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:10px">${escapeHtml(b.issueNumber)} · ${escapeHtml(b.issueDate)}</div>
  <h1 style="font-family:${theme.fontDisplay};font-size:42px;font-weight:400;color:#fff;margin:0 0 10px;letter-spacing:-0.02em">${escapeHtml(b.title)}</h1>
  <p style="font-family:${theme.fontDisplay};font-size:20px;font-style:italic;color:rgba(255,255,255,0.85);margin:0 0 16px">${escapeHtml(b.subtitle)}</p>
  <p style="font-family:${theme.fontBody};font-size:13px;color:rgba(255,255,255,0.7);margin:0">${escapeHtml(b.tagline)}</p>
</div>`;

    case 'ticker':
      return `
<div style="background:${b.backgroundColor || theme.primary};padding:10px 0;overflow:hidden">
  <div style="display:flex;gap:40px;font-family:${theme.fontMono};font-size:12px;color:${b.textColor || '#fff'};white-space:nowrap;padding:0 24px">
    ${(b.items as string[]).map(item => `<span>● ${escapeHtml(item)}</span>`).join('')}
  </div>
</div>`;

    case 'section-divider':
      return `
<div style="padding:32px 40px 16px;text-align:center">
  <div style="font-family:${theme.fontMono};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${theme.muted};margin-bottom:12px">${b.number ? `0${b.number} ——` : '——'} ${escapeHtml(b.label)} ——</div>
  <div style="height:1px;background:linear-gradient(90deg,transparent,${theme.border},transparent)"></div>
  ${b.description ? `<p style="font-family:${theme.fontBody};font-size:14px;color:${theme.muted};margin:12px 0 0">${escapeHtml(b.description)}</p>` : ''}
</div>`;

    case 'article-grid':
      return `
<div style="padding:0 40px 32px">
  ${b.sectionTitle ? `<h2 style="font-family:${theme.fontDisplay};font-size:26px;color:${theme.text};margin:0 0 20px">${escapeHtml(b.sectionTitle)}</h2>` : ''}
  <div style="display:grid;grid-template-columns:repeat(${b.columns},1fr);gap:20px">
    ${(b.articles as any[]).map(art => `
    <div style="border:1px solid ${theme.border};border-radius:12px;padding:20px;background:${theme.surface}">
      ${art.imageUrl ? `<img src="${escapeHtml(art.imageUrl)}" alt="${escapeHtml(art.title)}" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:14px">` : ''}
      <div style="font-family:${theme.fontMono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${theme.muted};margin-bottom:8px">${escapeHtml(art.source)} ${art.evidenceLevel ? `· ${art.evidenceLevel}` : ''}</div>
      <h3 style="font-family:${theme.fontDisplay};font-size:20px;color:${theme.text};margin:0 0 10px;line-height:1.25">
        ${art.url ? `<a href="${escapeHtml(art.url)}" style="color:${theme.text};text-decoration:none">${escapeHtml(art.title)}</a>` : escapeHtml(art.title)}
      </h3>
      <p style="font-family:${theme.fontBody};font-size:14px;color:${theme.muted};margin:0 0 12px;line-height:1.6">${escapeHtml(art.summary)}</p>
      ${art.clinicalContext ? `<div style="padding:12px;background:${theme.background};border-radius:8px;margin-bottom:10px"><p style="font-family:${theme.fontBody};font-size:13px;color:${theme.text};margin:0"><strong>Clinical Context:</strong> ${escapeHtml(art.clinicalContext)}</p></div>` : ''}
      ${art.myTake ? `<p style="font-family:${theme.fontBody};font-size:13px;color:${theme.secondary};font-style:italic;margin:0;border-left:3px solid ${theme.accent};padding-left:10px">${escapeHtml(art.myTake)}</p>` : ''}
      ${art.url ? `<a href="${escapeHtml(art.url)}" style="display:inline-block;margin-top:14px;font-family:${theme.fontBody};font-size:12px;color:${theme.accent};font-weight:600">Read full paper →</a>` : ''}
    </div>`).join('')}
  </div>
</div>`;

    case 'image':
      const imgSrc = b.dataUrl || b.url;
      if (!imgSrc) return '';
      return `
<div style="padding:16px 40px;text-align:${b.alignment}">
  ${b.linkUrl ? `<a href="${escapeHtml(b.linkUrl)}" target="_blank" rel="noopener">` : ''}
  <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(b.alt)}" style="max-width:${b.width === 'full' ? '100%' : b.width === 'wide' ? '80%' : b.width === 'medium' ? '60%' : '40%'};border-radius:${b.borderRadius}px;display:inline-block">
  ${b.linkUrl ? '</a>' : ''}
  ${b.caption ? `<p style="font-family:${theme.fontBody};font-size:12px;color:${theme.muted};margin:8px 0 0;text-align:center">${escapeHtml(b.caption)}</p>` : ''}
</div>`;

    case 'text':
      return `<div style="padding:16px 40px;font-family:${theme.fontBody};color:${theme.text};line-height:1.7;max-width:${b.maxWidth === 'reading' ? '720px' : b.maxWidth === 'narrow' ? '560px' : '100%'};margin:0 auto;text-align:${b.alignment}">${b.html}</div>`;

    case 'humor':
      return `
<div style="padding:32px 40px">
  <div style="background:linear-gradient(135deg,${theme.background},${theme.surface});border:1px solid ${theme.border};border-radius:16px;padding:28px;text-align:center">
    <div style="font-size:40px;margin-bottom:16px">${b.emojiDecor || '😄'}</div>
    <h3 style="font-family:${theme.fontDisplay};font-size:22px;color:${theme.text};margin:0 0 16px">${escapeHtml(b.heading)}</h3>
    <p style="font-family:${theme.fontBody};font-size:16px;color:${theme.text};font-style:italic;margin:0 0 14px;line-height:1.7">${escapeHtml(b.content)}</p>
    ${b.attribution ? `<p style="font-family:${theme.fontMono};font-size:12px;color:${theme.muted};margin:0">${escapeHtml(b.attribution)}</p>` : ''}
  </div>
</div>`;

    case 'spacer':
      return `<div style="height:${b.height}px${b.showLine ? `;border-top:1px ${b.lineStyle} ${theme.border}` : ''}"></div>`;

    case 'footer':
      return `
<div style="background:${theme.primary};padding:40px;text-align:center;margin-top:20px">
  <p style="font-family:${theme.fontDisplay};font-size:20px;color:#fff;margin:0 0 6px">${escapeHtml(b.institution)}</p>
  <p style="font-family:${theme.fontBody};font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 20px">${escapeHtml(b.department)}</p>
  <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:20px">
    ${b.subscribeUrl ? `<a href="${escapeHtml(b.subscribeUrl)}" style="font-family:${theme.fontBody};font-size:12px;color:rgba(255,255,255,0.7)">Subscribe</a>` : ''}
    ${b.unsubscribeUrl ? `<a href="${escapeHtml(b.unsubscribeUrl)}" style="font-family:${theme.fontBody};font-size:12px;color:rgba(255,255,255,0.7)">Unsubscribe</a>` : ''}
    ${b.websiteUrl ? `<a href="${escapeHtml(b.websiteUrl)}" style="font-family:${theme.fontBody};font-size:12px;color:rgba(255,255,255,0.7)">Website</a>` : ''}
    ${b.contactEmail ? `<a href="mailto:${escapeHtml(b.contactEmail)}" style="font-family:${theme.fontBody};font-size:12px;color:rgba(255,255,255,0.7)">Contact</a>` : ''}
  </div>
  <p style="font-family:${theme.fontBody};font-size:11px;color:rgba(255,255,255,0.5);margin:0 0 8px;max-width:600px;margin-left:auto;margin-right:auto;line-height:1.6">${escapeHtml(b.disclaimer)}</p>
  <p style="font-family:${theme.fontMono};font-size:11px;color:rgba(255,255,255,0.4);margin:0">© ${b.copyrightYear} ${escapeHtml(b.institution)}</p>
</div>`;

    default:
      return `<div style="padding:16px 40px;font-family:monospace;font-size:12px;color:#999">[${block.type} block]</div>`;
  }
}

export function exportToHtml(newsletter: Newsletter): string {
  const { theme, blocks, blockOrder } = newsletter;
  const body = blockOrder.map(id => blocks[id] ? blockToHtml(blocks[id], theme) : '').join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(newsletter.meta.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${theme.background};font-family:${theme.fontBody};color:${theme.text};line-height:1.6;-webkit-font-smoothing:antialiased}
  a{color:${theme.accent}}
  img{max-width:100%;height:auto}
  @media(max-width:600px){
    div[style*="grid-template-columns"]{display:block!important}
    div[style*="grid-template-columns"] > div{margin-bottom:16px}
  }
</style>
</head>
<body>
<div style="max-width:800px;margin:0 auto;background:${theme.surface}">
${body}
</div>
</body>
</html>`;
}

export function downloadHtml(newsletter: Newsletter) {
  const html = exportToHtml(newsletter);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nap-issue-${newsletter.meta.issueNumber || 'draft'}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
