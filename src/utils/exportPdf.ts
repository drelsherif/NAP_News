import type { Newsletter } from '../types';
import { exportToHtml } from './export';

export type PdfPageSize = 'A4' | 'Letter';

/**
 * Print-optimised CSS injected on top of the normal export CSS.
 * Handles:
 *  - Single-column collapse for all grid layouts
 *  - Background removal for clean paper output
 *  - Page break hints between major sections
 *  - Ticker hidden (animation won't work on print)
 *  - Font size normalisation for readability on paper
 *  - URL display suppressed for clean output
 */
function getPrintCss(pageSize: PdfPageSize = 'A4'): string {
  const pageSpec = pageSize === 'Letter'
    ? 'size: letter portrait; margin: 20mm 18mm 20mm 18mm;'
    : 'size: A4 portrait; margin: 18mm 16mm 18mm 16mm;';

  return `
@media print {
  /* ── Page setup ── */
  @page {
    ${pageSpec}
  }

  html, body {
    background: #fff !important;
    color: #000 !important;
    padding: 0 !important;
    margin: 0 !important;
    font-size: 11pt !important;
  }

  /* ── Shell: remove card chrome ── */
  .nap-export-wrap { display: block !important; }
  .nap-shell {
    max-width: 100% !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  /* ── Collapse all multi-column grids ── */
  .nap-2col,
  .nap-3col,
  .nap-5col,
  [style*="grid-template-columns"] {
    display: block !important;
  }
  .nap-2col > *,
  .nap-3col > *,
  .nap-5col > * {
    margin-bottom: 14pt !important;
    break-inside: avoid;
  }

  /* ── Hide interactive / animated elements ── */
  .nap-ticker,
  .nap-rss-config,
  .nap-copy-btn,
  .nap-expand-btn,
  details > summary,
  [data-editor-ui],
  script { display: none !important; }

  details { display: block !important; }
  details > *:not(summary) { display: block !important; }

  /* ── Strip gradient backgrounds, keep text readable ── */
  .nap-white-section {
    background: #1A2B4A !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }

  /* Force colour printing for all coloured sections */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Page breaks ── */
  .nap-white-section,
  [style*="padding:28px 40px"],
  [style*="padding:24px 40px"] {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* ── Images: never overflow page ── */
  img {
    max-width: 100% !important;
    max-height: 220pt !important;
    object-fit: contain !important;
  }

  /* ── SUPPRESS URL display for clean PDF output ── */
  a[href]::after { content: none !important; }

  /* ── Typography adjustments for paper ── */
  h1 { font-size: 28pt !important; }
  h2 { font-size: 20pt !important; }
  h3 { font-size: 14pt !important; }
  p, li { line-height: 1.55 !important; }
}
`;
}

/**
 * Opens the browser print dialog pre-loaded with print-optimised HTML.
 * The user can then "Save as PDF" from their browser's print dialog.
 * Works on all modern browsers on desktop and iOS/Android.
 *
 * pageSize: 'A4' (default) or 'Letter'
 */
export function printAsPdf(newsletter: Newsletter, pageSize: PdfPageSize = 'A4'): void {
  const printHtml = exportToHtml(newsletter, { extraCss: getPrintCss(pageSize) });

  // Open in a hidden iframe, trigger print, then remove
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;opacity:0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    // Fallback: open in new window
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printHtml);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 800);
    }
    return;
  }

  doc.open();
  doc.write(printHtml);
  doc.close();

  // Wait for fonts + images to load before printing
  const printAndCleanup = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Remove iframe after print dialog closes (small delay for Safari)
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 2000);
  };

  if (iframe.contentDocument?.readyState === 'complete') {
    setTimeout(printAndCleanup, 600);
  } else {
    iframe.onload = () => setTimeout(printAndCleanup, 600);
  }
}
