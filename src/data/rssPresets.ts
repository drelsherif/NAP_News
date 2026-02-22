export type RssPreset = {
  id: string;
  label: string;
  url: string;
  tags: string[];
};

// Curated, known-working RSS feeds (as of Feb 2026). Keep this list short and high-signal.
// NOTE: These are plain RSS/Atom URLs. Any CORS handling is done by the app/export proxy layer.
export const RSS_PRESETS: RssPreset[] = [
  {
    id: 'jama-neuro-onlinefirst',
    label: 'JAMA Neurology — Online First',
    url: 'https://jamanetwork.com/rss/site_16/onlineFirst_72.xml',
    tags: ['neurology', 'journal'],
  },
  {
    id: 'jama-neuro-current',
    label: 'JAMA Neurology — Current Issue',
    url: 'https://jamanetwork.com/rss/site_16/72.xml',
    tags: ['neurology', 'journal'],
  },
  {
    id: 'practical-neurology-current',
    label: 'Practical Neurology (BMJ) — Current Issue',
    url: 'https://pn.bmj.com/rss/current.xml',
    tags: ['neurology', 'journal'],
  },
  {
    id: 'fierce-healthcare-healthtech',
    label: 'Fierce Healthcare — Health Tech',
    url: 'https://www.fiercehealthcare.com/rss/health%20%26%20tech/xml',
    tags: ['ai', 'health-it', 'news'],
  },
  {
    id: 'fierce-healthcare-all',
    label: 'Fierce Healthcare — All Stories',
    url: 'https://www.fiercehealthcare.com/rss/xml',
    tags: ['health-it', 'news'],
  },
  {
    id: 'nejm-ai-podcast',
    label: 'NEJM AI Grand Rounds (Podcast RSS)',
    url: 'https://ai-podcast.nejm.org/feed.xml',
    tags: ['ai', 'medicine', 'podcast'],
  },
];
