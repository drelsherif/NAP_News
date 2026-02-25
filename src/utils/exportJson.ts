import type { Newsletter } from '../types';

/**
 * Returns the canonical filename for a newsletter JSON file.
 * Always: newsletter_issue{N}.json  (e.g. newsletter_issue001.json)
 */
export function newsletterJsonFilename(newsletter: Newsletter): string {
  const num = (newsletter.meta?.issueNumber || 'draft').replace(/\s+/g, '');
  return `newsletter_issue${num}.json`;
}

/**
 * Downloads the newsletter state as a formatted JSON file.
 */
export function downloadJson(newsletter: Newsletter): void {
  const filename = newsletterJsonFilename(newsletter);
  const json = JSON.stringify(newsletter, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
