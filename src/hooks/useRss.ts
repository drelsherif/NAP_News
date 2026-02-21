import { useState, useCallback } from 'react';
import type { RssFeedConfig, RssItem } from '../types';

const DEFAULT_FEEDS: RssFeedConfig[] = [
  { url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?term=neurology+artificial+intelligence&sort=date', label: 'PubMed – Neurology AI', enabled: true },
  { url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?term=stroke+artificial+intelligence&sort=date', label: 'PubMed – Stroke AI', enabled: true },
  { url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?term=epilepsy+deep+learning&sort=date', label: 'PubMed – Epilepsy DL', enabled: true },
  { url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?term=EEG+machine+learning&sort=date', label: 'PubMed – EEG ML', enabled: false },
];

const PROXY = 'https://api.allorigins.win/raw?url=';

function parseXml(xml: string, feedLabel: string): RssItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return [];

    // RSS 2.0
    const rssItems = Array.from(doc.querySelectorAll('item'));
    if (rssItems.length) {
      return rssItems.map(el => ({
        title: el.querySelector('title')?.textContent?.trim() || '',
        link: el.querySelector('link')?.textContent?.trim() || '',
        pubDate: el.querySelector('pubDate')?.textContent?.trim() || '',
        source: el.querySelector('source')?.textContent?.trim() || feedLabel,
        description: el.querySelector('description')?.textContent?.trim() || '',
        imageUrl: el.querySelector('enclosure[type^="image"]')?.getAttribute('url') || '',
      }));
    }

    // Atom
    const atomEntries = Array.from(doc.querySelectorAll('entry'));
    return atomEntries.map(el => ({
      title: el.querySelector('title')?.textContent?.trim() || '',
      link: el.querySelector('link')?.getAttribute('href') || el.querySelector('link')?.textContent?.trim() || '',
      pubDate: el.querySelector('updated')?.textContent?.trim() || el.querySelector('published')?.textContent?.trim() || '',
      source: doc.querySelector('feed > title')?.textContent?.trim() || feedLabel,
      description: el.querySelector('summary')?.textContent?.trim() || el.querySelector('content')?.textContent?.trim() || '',
      imageUrl: '',
    }));
  } catch {
    return [];
  }
}

export function useRss() {
  const [feeds, setFeeds] = useState<RssFeedConfig[]>(DEFAULT_FEEDS);
  const [items, setItems] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [filter, setFilter] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    const allItems: RssItem[] = [];
    const newErrors: string[] = [];

    for (const feed of feeds.filter(f => f.enabled)) {
      try {
        const res = await fetch(PROXY + encodeURIComponent(feed.url), { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        allItems.push(...parseXml(xml, feed.label));
      } catch (e: any) {
        newErrors.push(`${feed.label}: ${e.message}`);
      }
    }

    // Deduplicate by link
    const seen = new Set<string>();
    const deduped = allItems.filter(it => {
      if (!it.link || seen.has(it.link)) return false;
      seen.add(it.link);
      return true;
    });

    // Sort by date desc
    deduped.sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0));

    setItems(deduped);
    setErrors(newErrors);
    setLoading(false);
  }, [feeds]);

  const filteredItems = filter
    ? items.filter(it => (it.title + ' ' + it.description).toLowerCase().includes(filter.toLowerCase()))
    : items;

  const addFeed = useCallback((url: string, label: string) => {
    setFeeds(prev => [...prev, { url, label, enabled: true }]);
  }, []);

  const removeFeed = useCallback((url: string) => {
    setFeeds(prev => prev.filter(f => f.url !== url));
  }, []);

  const toggleFeed = useCallback((url: string) => {
    setFeeds(prev => prev.map(f => f.url === url ? { ...f, enabled: !f.enabled } : f));
  }, []);

  return {
    feeds, items: filteredItems, loading, errors, filter,
    refresh, setFilter, addFeed, removeFeed, toggleFeed,
  };
}
