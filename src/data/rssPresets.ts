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
    id: 'frontiers-in-neuroscience-rss',
    label: 'Frontiers in Neuroscience — RSS',
    url: 'https://www.frontiersin.org/journals/neuroscience/rss',
    tags: ["neuroscience", "journal"],
  },
  {
    id: 'frontiers-in-neurology-rss',
    label: 'Frontiers in Neurology — RSS',
    url: 'https://www.frontiersin.org/journals/neurology/rss',
    tags: ["neurology", "journal"],
  },
  {
    id: 'mit-news-artificial-intelligence',
    label: 'MIT News — Artificial Intelligence',
    url: 'https://news.mit.edu/rss/topic/artificial-intelligence2',
    tags: ["ai", "news"],
  },
  {
    id: 'sciencedaily-artificial-intelligence',
    label: 'ScienceDaily — Artificial Intelligence',
    url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml',
    tags: ["ai", "news"],
  },
  {
    id: 'marktechpost-ai-news',
    label: 'MarkTechPost — AI News',
    url: 'https://www.marktechpost.com/feed/',
    tags: ["ai", "news"],
  },
  {
    id: 'the-lancet-neurology-current',
    label: 'The Lancet Neurology — Current',
    url: 'https://www.thelancet.com/rssfeed/laneur_current.xml',
    tags: ["neurology", "journal"],
  },
  {
    id: 'jama-neurology-rss',
    label: 'JAMA Neurology — RSS',
    url: 'https://jamanetwork.com/rss/site_16/0.xml',
    tags: ["neurology", "journal"],
  },
  {
    id: 'npj-digital-medicine-rss',
    label: 'npj Digital Medicine — RSS',
    url: 'https://www.nature.com/npjdigitalmed.rss',
    tags: ["digital-medicine", "journal"],
  },
  {
    id: 'pubmed-rss-neurology-ai-search',
    label: 'PubMed RSS — Neurology AI Search',
    url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1x9bY_ZPGMIgWOrGWvQbkjt2X1J5zCH66gaj5UHwPTuOP_TklI/?limit=15&utm_campaign=pubmed-2&fc=20260222062849',
    tags: ["pubmed", "ai", "neurology"],
  },
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
