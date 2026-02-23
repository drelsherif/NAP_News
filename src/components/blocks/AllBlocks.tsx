import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Newsletter, Article } from '../../types';
import type {
  HeaderBlock as HeaderBlockType,
  TickerBlock as TickerBlockType,
  SectionDividerBlock as SectionDividerBlockType,
  ArticleGridBlock as ArticleGridBlockType,
  SpotlightBlock as SpotlightBlockType,
  EthicsSplitBlock as EthicsSplitBlockType,
  ImageBlock as ImageBlockType,
  TextBlock as TextBlockType,
  HtmlEmbedBlock as HtmlEmbedBlockType,
  PromptMasterclassBlock as PromptMasterclassBlockType,
  SbarPromptBlock as SbarPromptBlockType,
  PromptTemplateBlock as PromptTemplateBlockType,
  SafetyRemindersBlock as SafetyRemindersBlockType,
  ClinicalPromptTemplatesBlock as ClinicalPromptTemplatesBlockType,
  TermOfMonthBlock as TermOfMonthBlockType,
  AiCaseFileBlock as AiCaseFileBlockType,
  QuickHitsBlock as QuickHitsBlockType,
  HumorBlock as HumorBlockType,
  SpacerBlock as SpacerBlockType,
  FooterBlock as FooterBlockType,
  AiSafetyBlock as AiSafetyBlockType,
  NorthwellSpotlightBlock as NorthwellSpotlightBlockType,
  RssSidebarBlock as RssSidebarBlockType,
  ClinicalPrompt,
  SafetyUpdate,
  NorthwellItem,
} from '../../types';

import { EditableText } from './EditableText';
import { EditableHtml } from './EditableHtml';
import { RichTextEditor } from '../editor/RichTextEditor';

type T = Newsletter['theme'];
const pad = (h = 32, v = 40) => ({ padding: `${h}px ${v}px` } as React.CSSProperties);

// ─── Local helper types (kept local to avoid coupling to ../../types) ──────────
type SbarStep = {
  letter: string;
  name?: string;
  description?: string;
  example?: string;
};

type QuickHit = {
  id: string;
  title?: string;
  source?: string;
  summary?: string;
  url?: string;
};


// ─── Header ──────────────────────────────────────────────────────────────────
export function HeaderBlock({ block, theme, editable, onUpdateBlock }: { block: HeaderBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<HeaderBlockType>) => void }) {
  const bg = block.backgroundStyle === 'solid'
    ? theme.primary
    : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 60%, ${theme.accent}44 100%)`;
  return (
    <div className="nap-white-section" style={{ background: bg, padding: '48px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden', color: '#fff' }}>
      <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.08 }} viewBox="0 0 800 60" fill="none" preserveAspectRatio="none" height={60}>
        <path d="M0 40 Q200 0 400 30 Q600 60 800 20 L800 60 L0 60Z" fill="white" />
      </svg>
      {(block.logoDataUrl || block.logoUrl) && (
        <div style={{ marginBottom: 20 }}><img src={block.logoDataUrl || block.logoUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: 240, borderRadius: 8 }} /></div>
      )}
      <div style={{ fontFamily: theme.fontMono, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 12 }}>
        {block.issueNumber} · {block.issueDate}
      </div>
      <h1 style={{ fontFamily: theme.fontDisplay, fontSize: 46, fontWeight: 400, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {editable ? (
          <EditableText value={block.title} placeholder="Newsletter title" onCommit={(v) => onUpdateBlock({ title: v })} style={{ display: 'block', width: '100%' }} />
        ) : (
          block.title
        )}
      </h1>
      <p style={{ fontFamily: theme.fontDisplay, fontSize: 20, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', margin: '0 0 18px', lineHeight: 1.3 }}>
        {editable ? (
          <EditableText value={block.subtitle} placeholder="Subtitle" onCommit={(v) => onUpdateBlock({ subtitle: v })} style={{ display: 'block', width: '100%' }} />
        ) : (
          block.subtitle
        )}
      </p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', maxWidth: 280, margin: '0 auto 18px' }} />
      <p style={{ fontFamily: theme.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, letterSpacing: '0.02em' }}>
        {editable ? (
          <EditableText value={block.tagline} placeholder="Tagline" onCommit={(v) => onUpdateBlock({ tagline: v })} style={{ display: 'block', width: '100%' }} />
        ) : (
          block.tagline
        )}
      </p>
    </div>
  );
}

// ─── Ticker (with clickable links) ────────────────────────────────────────────
export function TickerBlock({ block, theme }: { block: TickerBlockType; theme: T; newsletter: any; onUpdateBlock: any }) {
  const speeds = { slow: 60, medium: 36, fast: 20 };
  const dur = speeds[block.speed] || 36;
  const PROXY = 'https://api.allorigins.win/get?url=';

  const [rssLinks, setRssLinks] = useState<{ text: string; url: string }[]>([]);

  const parseXml = useCallback((xml: string): { text: string; url: string }[] => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      if (doc.querySelector('parsererror')) return [];

      const rssItems = Array.from(doc.querySelectorAll('item'));
      if (rssItems.length) {
        return rssItems
          .map((el) => ({
            text: el.querySelector('title')?.textContent?.trim() || '',
            url: el.querySelector('link')?.textContent?.trim() || '',
          }))
          .filter((x) => !!x.text);
      }

      // Atom
      const entries = Array.from(doc.querySelectorAll('entry'));
      return entries
        .map((el) => ({
          text: el.querySelector('title')?.textContent?.trim() || '',
          url: el.querySelector('link')?.getAttribute('href') || el.querySelector('link')?.textContent?.trim() || '',
        }))
        .filter((x) => !!x.text);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (block.sourceMode !== 'rss') {
        setRssLinks([]);
        return;
      }
      const urls = (block.rssUrls || []).filter(Boolean);
      if (!urls.length) {
        setRssLinks([]);
        return;
      }

      const all: { text: string; url: string }[] = [];
      for (const url of urls) {
        try {
          const res = await fetch(PROXY + encodeURIComponent(url), { cache: 'no-store' });
          if (!res.ok) continue;
          const data = await res.json();
          const xml = (data && typeof data.contents === 'string') ? data.contents : '';
          all.push(...parseXml(xml));
        } catch {
          // ignore per-feed errors in ticker (avoid noisy UI)
        }
      }
      // de-dupe by url or text
      const seen = new Set<string>();
      const deduped = all.filter((x) => {
        const key = x.url || x.text;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const limited = deduped.slice(0, Math.max(1, block.rssMaxItems || 20));
      if (!cancelled) setRssLinks(limited);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [block.sourceMode, (block.rssUrls || []).join('|'), block.rssMaxItems, parseXml]);

  const hasRss = block.sourceMode === 'rss' && rssLinks.length > 0;
  const hasLinks = !hasRss && block.useLinks && (block.links || []).length > 0;

  const linkItems = hasRss
    ? [...rssLinks, ...rssLinks]
    : hasLinks
      ? [...(block.links || []), ...(block.links || [])]
      : [];

  const textItems = hasRss || hasLinks ? [] : [...(block.items || []), ...(block.items || [])];

  return (
    <div className="nap-ticker" style={{ background: block.backgroundColor || theme.primary, overflow: 'hidden', height: 40, display: 'flex', alignItems: 'center', color: block.textColor || '#fff' }}>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap', animation: `ticker ${dur}s linear infinite`, willChange: 'transform' }}>
        {linkItems.length
          ? linkItems.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: theme.fontMono, fontSize: 12, color: block.textColor || '#fff', padding: '0 32px', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent, display: 'inline-block', flexShrink: 0 }} />
                {link.text}
                <span style={{ fontSize: 10, opacity: 0.6 }}>↗</span>
              </a>
            ))
          : textItems.map((item, i) => (
              <span key={i} style={{ fontFamily: theme.fontMono, fontSize: 12, color: block.textColor || '#fff', padding: '0 32px', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent, display: 'inline-block', flexShrink: 0 }} />
                {item}
              </span>
            ))
        }
      </div>
    </div>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
export function SectionDividerBlock({ block, theme, editable, onUpdateBlock }: { block: SectionDividerBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<SectionDividerBlockType>) => void }) {
  if (block.style === 'bold') {
    return (
      <div className="nap-white-section" style={{ background: theme.primary, padding: '18px 40px', display: 'flex', alignItems: 'center', gap: 16, color: '#fff' }}>
        {block.number > 0 && <span style={{ fontFamily: theme.fontMono, fontSize: 32, fontWeight: 300, color: 'rgba(255,255,255,0.25)', lineHeight: 1 }}>{String(block.number).padStart(2, '0')}</span>}
        <div>
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Section</div>
          <div style={{ fontFamily: theme.fontDisplay, fontSize: 22, color: '#fff', lineHeight: 1.15 }}>
            {editable ? (
              <EditableText value={block.label} placeholder="Section title" onCommit={(v) => onUpdateBlock({ label: v })} style={{ display: 'block', width: '100%' }} />
            ) : (
              block.label
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: '32px 40px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: block.description ? 10 : 0 }}>
        <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: theme.muted, whiteSpace: 'nowrap' }}>
          <span>{block.number > 0 ? `0${block.number} —— ` : '—— '}</span>
          {editable ? (
            <EditableText value={block.label} placeholder="Section title" onCommit={(v) => onUpdateBlock({ label: v })} style={{ display: 'block', width: '100%', color: theme.muted }} />
          ) : (
            <span>{block.label}</span>
          )}
          <span> ——</span>
        </div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.border}, transparent)` }} />
      </div>
      <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.muted, margin: 0, lineHeight: 1.6 }}>
        {editable ? (
          <EditableText value={block.description || ''} placeholder="Section description" multiline onCommit={(v) => onUpdateBlock({ description: v })} style={{ minHeight: 18 }} />
        ) : (
          block.description
        )}
      </p>
    </div>
  );
}

// ─── Article Grid ─────────────────────────────────────────────────────────────
export function ArticleGridBlock({ block, theme, editable, onUpdateBlock, onUpdateArticle }: { block: ArticleGridBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: any; onUpdateArticle: any; onDeleteArticle: any; onMoveArticle: any; onAddArticle: any }) {
  return (
    <div style={pad(24, 40)}>
      {block.sectionTitle !== undefined && (
        <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 26, color: theme.text, margin: '0 0 20px', fontWeight: 400 }}>
          {editable ? (
            <EditableText value={block.sectionTitle || ''} placeholder="Section title" onCommit={(v) => onUpdateBlock({ sectionTitle: v })} style={{ display: 'block', width: '100%' }} />
          ) : (
            block.sectionTitle
          )}
        </h2>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.columns}, 1fr)`, gap: 20 }}>
        {(block.articles || []).map(art => (
          <ArticleCard
            key={art.id}
            article={art}
            theme={theme}
            layout={block.layout}
            editable={editable}
            onUpdate={(c) => onUpdateArticle(art.id, c)}
          />
        ))}
      </div>
    </div>
  );
}

function ArticleCard({ article: art, theme, layout, editable, onUpdate }: { article: Article; theme: T; layout: string; editable?: boolean; onUpdate: (c: Partial<Article>) => void }) {
  const evidenceColors: Record<string, string> = { High: '#00A651', Moderate: '#F47920', Low: '#C0392B', 'Expert Opinion': '#7B2D8B' };
  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden', background: theme.surface, display: 'flex', flexDirection: 'column' }}>
      {art.imageUrl && <div style={{ height: 160, overflow: 'hidden', flexShrink: 0 }}><img src={art.imageUrl} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
      <div style={{ padding: layout === 'compact' ? '10px 14px' : '16px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.muted }}>
            {editable ? (
              <EditableText value={art.source || ''} placeholder="Source" onCommit={(v) => onUpdate({ source: v })} style={{ display: 'block', width: '100%', color: theme.muted }} />
            ) : (
              art.source
            )}
          </span>
          {art.evidenceLevel && <span style={{ background: evidenceColors[art.evidenceLevel] + '22', color: evidenceColors[art.evidenceLevel], border: `1px solid ${evidenceColors[art.evidenceLevel]}44`, borderRadius: 999, padding: '2px 8px', fontFamily: theme.fontMono, fontSize: 10, fontWeight: 600 }}>{art.evidenceLevel}</span>}
        </div>
        <h3 style={{ fontFamily: theme.fontDisplay, fontSize: layout === 'compact' ? 16 : 20, color: theme.text, margin: '0 0 10px', lineHeight: 1.25, fontWeight: 400 }}>
          {editable ? (
            <EditableText value={art.title || ''} placeholder="Article title" multiline={false} onCommit={(v) => onUpdate({ title: v })} style={{ display: 'block', width: '100%' }} />
          ) : (
            (art.url ? <a href={art.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.text, textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = theme.accent} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = theme.text}>{art.title}</a> : art.title)
          )}
        </h3>
        {!layout.includes('compact') && (
          <p style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.muted, margin: '0 0 12px', lineHeight: 1.6, flex: 1 }}>
            {editable ? (
              <EditableText value={art.summary || ''} placeholder="Summary" multiline onCommit={(v) => onUpdate({ summary: v })} style={{ minHeight: 18, color: theme.muted }} />
            ) : (
              art.summary
            )}
          </p>
        )}
        <div style={{ background: theme.background, borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.muted, marginBottom: 4 }}>Clinical Context</div>
          <p style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.text, margin: 0, lineHeight: 1.55 }}>
            {editable ? (
              <EditableText value={art.clinicalContext || ''} placeholder="Clinical context" multiline onCommit={(v) => onUpdate({ clinicalContext: v })} style={{ minHeight: 18 }} />
            ) : (
              art.clinicalContext
            )}
          </p>
        </div>
        <p style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.secondary, fontStyle: 'italic', margin: '0 0 12px', borderLeft: `3px solid ${theme.accent}`, paddingLeft: 10, lineHeight: 1.5 }}>
          {editable ? (
            <EditableText value={art.myTake || ''} placeholder="My take" multiline onCommit={(v) => onUpdate({ myTake: v })} style={{ minHeight: 18, color: theme.secondary }} />
          ) : (
            art.myTake
          )}
        </p>
        {art.url && <a href={art.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: theme.fontBody, fontSize: 12, color: theme.accent, fontWeight: 600, textDecoration: 'none' }}>Read full paper <span style={{ fontSize: 14 }}>→</span></a>}
      </div>
    </div>
  );
}

// ─── Spotlight ────────────────────────────────────────────────────────────────
export function SpotlightBlock({ block, theme, editable, onUpdateArticle }: { block: SpotlightBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: any; onUpdateArticle: any; onDeleteArticle: any; onMoveArticle: any; onAddArticle: any }) {
  const art = block.article;
  const isLeft = block.layout === 'left-image';
  const isTop = block.layout === 'top-image';
  const hasImage = !!art.imageUrl;
  if (isTop && hasImage) {
    return (
      <div style={pad(24, 40)}>
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden', background: theme.surface }}>
          <img src={art.imageUrl} alt={art.title} style={{ width: '100%', height: 280, objectFit: 'cover' }} />
          <div style={{ padding: 24 }}>
            <SpotlightContent art={art} theme={theme} accentColor={block.accentColor} editable={editable} onUpdate={(c) => onUpdateArticle(art.id, c)} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={pad(24, 40)}>
      <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden', background: theme.surface, display: 'flex', flexDirection: hasImage ? (isLeft ? 'row' : 'row-reverse') : 'column' }}>
        {hasImage && <div style={{ width: '40%', flexShrink: 0 }}><img src={art.imageUrl} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div>}
        <div style={{ flex: 1, padding: 28, borderLeft: hasImage && isLeft ? `4px solid ${block.accentColor || theme.accent}` : undefined, minWidth: 0 }}>
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.muted, marginBottom: 12 }}>✦ Spotlight · {art.source}</div>
          <SpotlightContent art={art} theme={theme} accentColor={block.accentColor} editable={editable} onUpdate={(c) => onUpdateArticle(art.id, c)} />
        </div>
      </div>
    </div>
  );
}

function SpotlightContent({ art, theme, accentColor, editable, onUpdate }: { art: Article; theme: T; accentColor: string; editable?: boolean; onUpdate: (c: Partial<Article>) => void }) {
  return (<>
    <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 28, color: theme.text, margin: '0 0 12px', fontWeight: 400, lineHeight: 1.2 }}>
      {editable ? (
        <EditableText value={art.title || ''} placeholder="Spotlight title" onCommit={(v) => onUpdate({ title: v })} style={{ display: 'block', width: '100%' }} />
      ) : (
        (art.url ? <a href={art.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.text, textDecoration: 'none' }}>{art.title}</a> : art.title)
      )}
    </h2>
    <p style={{ fontFamily: theme.fontBody, fontSize: 15, color: theme.muted, margin: '0 0 16px', lineHeight: 1.65 }}>
      {editable ? (
        <EditableText value={art.summary || ''} placeholder="Summary" multiline onCommit={(v) => onUpdate({ summary: v })} style={{ minHeight: 22, color: theme.muted }} />
      ) : (
        art.summary
      )}
    </p>
    <div style={{ background: theme.background, borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.muted, marginBottom: 6 }}>Clinical Context</div>
      <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.text, margin: 0, lineHeight: 1.6 }}>
        {editable ? (
          <EditableText value={art.clinicalContext || ''} placeholder="Clinical context" multiline onCommit={(v) => onUpdate({ clinicalContext: v })} style={{ minHeight: 22 }} />
        ) : (
          art.clinicalContext
        )}
      </p>
    </div>
    <p style={{ fontFamily: theme.fontBody, fontSize: 14, fontStyle: 'italic', color: theme.secondary, margin: '0 0 16px', borderLeft: `3px solid ${accentColor}`, paddingLeft: 12, lineHeight: 1.6 }}>
      {editable ? (
        <EditableText value={art.myTake || ''} placeholder="My take" multiline onCommit={(v) => onUpdate({ myTake: v })} style={{ minHeight: 22, color: theme.secondary }} />
      ) : (
        art.myTake
      )}
    </p>
    {art.url && <a href={art.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: accentColor || theme.accent, color: '#fff', borderRadius: 8, fontFamily: theme.fontBody, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Read the paper →</a>}
  </>);
}

// ─── Ethics Split ─────────────────────────────────────────────────────────────
export function EthicsSplitBlock({ block, theme, editable, onUpdateBlock }: { block: EthicsSplitBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: any }) {
  return (
    <div style={pad(28, 40)}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.accent, marginBottom: 6 }}>⚖ AI Ethics & Governance</div>
        <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 26, color: theme.text, margin: '0 0 6px', fontWeight: 400 }}>
          {editable ? (
            <EditableText value={block.heading || ''} placeholder="Heading" onCommit={(v) => onUpdateBlock({ heading: v })} style={{ display: 'block', width: '100%' }} />
          ) : (
            block.heading
          )}
        </h2>
        <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.muted, margin: 0 }}>
          {editable ? (
            <EditableText value={block.subheading || ''} placeholder="Subheading" multiline onCommit={(v) => onUpdateBlock({ subheading: v })} style={{ minHeight: 18, color: theme.muted }} />
          ) : (
            block.subheading
          )}
        </p>
        {block.source !== undefined && (
          <div style={{ fontFamily: theme.fontMono, fontSize: 11, color: theme.muted, marginTop: 6 }}>
            Source:{' '}
            {editable ? (
              <EditableText value={block.source || ''} placeholder="Source" onCommit={(v) => onUpdateBlock({ source: v })} style={{ display: 'block', width: '100%', color: theme.muted }} />
            ) : (
              (block.url ? <a href={block.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>{block.source}</a> : block.source)
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, background: theme.background }}>
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C0392B', fontWeight: 700, marginBottom: 10 }}>
            {editable ? <EditableText value={block.leftTitle || ''} placeholder="Left title" onCommit={(v) => onUpdateBlock({ leftTitle: v })} style={{ display: 'block', width: '100%', color: '#C0392B' }} /> : block.leftTitle}
          </div>
          <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.text, margin: 0, lineHeight: 1.65 }}>
            {editable ? <EditableText value={block.leftContent || ''} placeholder="Left content" multiline onCommit={(v) => onUpdateBlock({ leftContent: v })} style={{ minHeight: 18 }} /> : block.leftContent}
          </p>
        </div>
        <div style={{ border: `1px solid ${theme.accent}44`, borderRadius: 12, padding: 20, background: theme.accent + '0A' }}>
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.accent, fontWeight: 700, marginBottom: 10 }}>
            {editable ? <EditableText value={block.rightTitle || ''} placeholder="Right title" onCommit={(v) => onUpdateBlock({ rightTitle: v })} style={{ display: 'block', width: '100%', color: theme.accent }} /> : block.rightTitle}
          </div>
          <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.text, margin: 0, lineHeight: 1.65 }}>
            {editable ? <EditableText value={block.rightContent || ''} placeholder="Right content" multiline onCommit={(v) => onUpdateBlock({ rightContent: v })} style={{ minHeight: 18 }} /> : block.rightContent}
          </p>
        </div>
      </div>
      <div style={{ marginTop: 16, padding: '14px 18px', border: `1px solid ${theme.border}`, borderRadius: 12, borderLeft: `4px solid ${theme.accent}` }}>
        <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.muted, marginBottom: 6 }}>Clinical Perspective</div>
        <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.text, margin: 0, lineHeight: 1.65 }}>
          {editable ? <EditableText value={block.clinicalPerspective || ''} placeholder="Clinical perspective" multiline onCommit={(v) => onUpdateBlock({ clinicalPerspective: v })} style={{ minHeight: 18 }} /> : block.clinicalPerspective}
        </p>
      </div>
    </div>
  );
}

// ─── Image ────────────────────────────────────────────────────────────────────
export function ImageBlock({ block, theme }: { block: ImageBlockType; theme: T; newsletter: any; onUpdateBlock: any }) {
  const src = block.dataUrl || block.url;
  const widthMap = { full: '100%', wide: '80%', medium: '60%', small: '40%' };
  const maxWidth = widthMap[block.width] || '100%';
  if (!src) {
    return (
      <div style={{ padding: '24px 40px', textAlign: block.alignment as any }}>
        <div style={{ display: 'inline-block', border: `2px dashed ${theme.border}`, borderRadius: 12, padding: '40px 60px', color: theme.muted, fontFamily: theme.fontBody, fontSize: 13 }}>🖼️ No image — configure in Block Settings</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '16px 40px', textAlign: block.alignment as any }}>
      {block.linkUrl ? <a href={block.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', maxWidth }}><img src={src} alt={block.alt} style={{ width: '100%', borderRadius: block.borderRadius, display: 'block' }} /></a>
        : <img src={src} alt={block.alt} style={{ maxWidth, width: '100%', borderRadius: block.borderRadius, display: 'inline-block' }} />}
      {block.caption && <p style={{ fontFamily: theme.fontBody, fontSize: 12, color: theme.muted, margin: '8px 0 0', textAlign: 'center' }}>{block.caption}</p>}
    </div>
  );
}

// ─── Text ─────────────────────────────────────────────────────────────────────
export function TextBlock({ block, theme, editable, onUpdateBlock }: { block: TextBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<TextBlockType>) => void }) {
  const maxWidthMap = { full: '100%', reading: '720px', narrow: '560px' };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  };

  return (
    <div style={{ padding: '16px 40px' }}>
      <div style={{ fontFamily: theme.fontBody, color: theme.text, lineHeight: 1.7, maxWidth: (maxWidthMap as any)[block.maxWidth] || '100%', margin: '0 auto', textAlign: block.alignment as any, fontSize: 15 }}>
        {editable ? (
          <RichTextEditor
            html={block.html || ''}
            placeholder="Type here…"
            onChangeHtml={(v) => onUpdateBlock({ html: v })}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: block.html }} />
        )}
      </div>
    </div>
  );
}

// ─── HTML Embed ─────────────────────────────────────────────────────────────── ───────────────────────────────────────────────────────────────
export function HtmlEmbedBlock({ block, theme, editable, onUpdateBlock }: { block: HtmlEmbedBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<HtmlEmbedBlockType>) => void }) {
  return (
    <div style={{ padding: '16px 40px' }}>
      <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.muted, marginBottom: 8 }}>
        💻{' '}
        {editable ? (
          <EditableText value={block.label || ''} placeholder="Embed label" onCommit={(v) => onUpdateBlock({ label: v })} style={{ display: 'block', width: '100%', color: theme.muted }} />
        ) : (
          block.label
        )}
      </div>
      {editable ? (
        <EditableHtml html={block.html || ''} placeholder="Paste HTML here…" onCommit={(v) => onUpdateBlock({ html: v })} style={{ border: `1px dashed ${theme.border}`, borderRadius: 10, padding: 12, minHeight: 60, background: theme.background }} />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: block.html }} />
      )}
    </div>
  );
}

// ─── Prompt Masterclass ───────────────────────────────────────────────────────
export function PromptMasterclassBlock({ block, theme, editable, onUpdateBlock }: { block: PromptMasterclassBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<PromptMasterclassBlockType>) => void }) {
  return (
    <div style={pad(28, 40)}>
      <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.accent, marginBottom: 8 }}>🤖 Prompt Like a Rockstar</div>
      <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 26, color: theme.text, margin: '0 0 6px', fontWeight: 400 }}>
        {editable ? <EditableText value={block.heading || ''} placeholder="Heading" onCommit={(v) => onUpdateBlock({ heading: v })} style={{ display: 'block', width: '100%' }} /> : block.heading}
      </h2>
      <div style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.muted, marginBottom: 20 }}>
        {editable ? (
          <>
            <EditableText value={block.step || ''} placeholder="Step" onCommit={(v) => onUpdateBlock({ step: v })} style={{ display: 'block', width: '100%', color: theme.muted }} />
            {' · Framework: '}
            <strong><EditableText value={block.framework || ''} placeholder="Framework" onCommit={(v) => onUpdateBlock({ framework: v })} style={{ display: 'block', width: '100%' }} /></strong>
          </>
        ) : (
          <>
            {block.step} · Framework: <strong>{block.framework}</strong>
          </>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: `1px solid #f5c6c0`, borderRadius: 12, padding: 16, background: '#FEF0EE' }}>
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C0392B', marginBottom: 8 }}>❌ Bad Prompt</div>
          <p style={{ fontFamily: theme.fontBody, fontSize: 14, fontStyle: 'italic', color: '#7A1E12', margin: 0, lineHeight: 1.55 }}>
            {editable ? <EditableText value={block.badPrompt || ''} placeholder="Bad prompt" multiline onCommit={(v) => onUpdateBlock({ badPrompt: v })} style={{ minHeight: 18, color: '#7A1E12' }} /> : block.badPrompt}
          </p>
        </div>
        <div style={{ border: `1px solid ${theme.accent}44`, borderRadius: 12, padding: 16, background: theme.accent + '0D' }}>
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.accent, marginBottom: 8 }}>✓ Good Prompt</div>
          <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.text, margin: 0, lineHeight: 1.55 }}>
            {editable ? <EditableText value={block.goodPrompt || ''} placeholder="Good prompt" multiline onCommit={(v) => onUpdateBlock({ goodPrompt: v })} style={{ minHeight: 18 }} /> : block.goodPrompt}
          </p>
        </div>
      </div>
      <div style={{ marginTop: 14, padding: '12px 16px', background: theme.background, borderRadius: 10, borderLeft: `3px solid ${theme.accent}` }}>
        <p style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.muted, margin: 0, lineHeight: 1.6 }}>
          <strong>Why this matters:</strong>{' '}
          {editable ? <EditableText value={block.explanation || ''} placeholder="Explanation" multiline onCommit={(v) => onUpdateBlock({ explanation: v })} style={{ minHeight: 18, color: theme.muted }} /> : block.explanation}
        </p>
      </div>
    </div>
  );
}

// ─── SBAR-P Guide (fixed + fully editable) ────────────────────────────────────
export function SbarPromptBlock({ block, theme, editable, onUpdateBlock }: { block: SbarPromptBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<SbarPromptBlockType>) => void }) {
  const colors = [theme.primary, theme.secondary, theme.accent, '#7B2D8B', '#00A651'];

  const updateStep = (idx: number, changes: Partial<SbarStep>) => {
    const next = (block.steps || []).map((s, i) => (i === idx ? { ...s, ...changes } : s));
    onUpdateBlock({ steps: next });
  };

  return (
    <div style={pad(28, 40)}>
      <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.accent, marginBottom: 8 }}>📋 SBAR-P Framework</div>
      <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 26, color: theme.text, margin: '0 0 20px', fontWeight: 400 }}>
        {editable ? <EditableText value={block.heading || ''} placeholder="Heading" onCommit={(v) => onUpdateBlock({ heading: v })} style={{ display: 'block', width: '100%' }} /> : block.heading}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {(block.steps || []).map((step, i) => (
          <div key={step.letter} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, background: theme.surface }}>
            <div style={{ fontFamily: theme.fontDisplay, fontSize: 64, fontWeight: 400, color: colors[i] || theme.primary, lineHeight: 1, marginBottom: 6, fontStyle: 'italic' }}>{step.letter}</div>
            <div style={{ fontFamily: theme.fontMono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.muted, marginBottom: 8, paddingBottom: 8, borderBottom: `2px solid ${colors[i] || theme.primary}` }}>
              {editable ? (
                <EditableText value={step.name || ''} placeholder="Step name" onCommit={(v) => updateStep(i, { name: v })} style={{ display: 'block', width: '100%', color: theme.muted }} />
              ) : (
                step.name
              )}
            </div>
            <p style={{ fontFamily: theme.fontBody, fontSize: 12, color: theme.text, margin: '0 0 10px', lineHeight: 1.5 }}>
              {editable ? <EditableText value={step.description || ''} placeholder="Description" multiline onCommit={(v) => updateStep(i, { description: v })} style={{ minHeight: 18 }} /> : step.description}
            </p>
            <div style={{ background: theme.background, borderRadius: 6, padding: '8px 10px', borderLeft: `3px solid ${colors[i] || theme.primary}` }}>
              <p style={{ fontFamily: theme.fontBody, fontSize: 11, color: theme.muted, margin: 0, fontStyle: 'italic', lineHeight: 1.45 }}>
                {editable ? <EditableText value={step.example || ''} placeholder="Example" multiline onCommit={(v) => updateStep(i, { example: v })} style={{ minHeight: 18, color: theme.muted }} /> : step.example}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Template Prompt (collapsible + copy) ────────────────────────────────────
export function PromptTemplateBlock({ block, theme, editable, onUpdateBlock }: { block: PromptTemplateBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<PromptTemplateBlockType>) => void }) {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    navigator.clipboard.writeText(block.prompt || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div style={pad(28, 40)}>
      <details style={{ border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden', background: theme.surface }}>
        <summary
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 14px',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.accent }}>🧩 Template Prompt</div>
            <div style={{ fontFamily: theme.fontDisplay, fontSize: 18, color: theme.text, fontWeight: 500 }}>
              {editable ? <EditableText value={block.heading || ''} placeholder="Heading" onCommit={(v) => onUpdateBlock({ heading: v })} /> : block.heading}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); doCopy(); }}
            style={{
              padding: '7px 12px',
              background: copied ? theme.accent : theme.primary,
              border: 'none',
              borderRadius: 8,
              fontFamily: theme.fontBody,
              fontSize: 12,
              color: '#fff',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </summary>

        <div style={{ padding: '12px 14px', background: theme.background, borderTop: `1px solid ${theme.border}` }}>
          <pre style={{ fontFamily: theme.fontMono, fontSize: 12, color: theme.text, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {editable ? (
              <EditableText
                value={block.prompt || ''}
                placeholder="Template prompt"
                multiline
                onCommit={(v) => onUpdateBlock({ prompt: v })}
                style={{ minHeight: 140, fontFamily: theme.fontMono, fontSize: 12 }}
              />
            ) : (
              block.prompt
            )}
          </pre>
        </div>
      </details>
    </div>
  );
}

// ─── Safety Reminders (configurable list) ───────────────────────────────────
export function SafetyRemindersBlock({ block, theme }: { block: SafetyRemindersBlockType; theme: T; newsletter: any; onUpdateBlock: any }) {
  const items = (block.items || []).filter(Boolean);
  return (
    <div style={pad(18, 40)}>
      <div style={{ border: '1px solid #F4D38B', background: '#FFF7E6', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A5A00' }}>⚠️ {block.heading || 'Safety Reminders'}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: items.length <= 2 ? '1fr' : '1fr 1fr', gap: 10 }}>
          {items.map((txt, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.65)', border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12, display: 'flex', gap: 10 }}>
              <div style={{ fontFamily: theme.fontMono, fontSize: 11, color: '#8A5A00', marginTop: 1 }}>▶</div>
              <div style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.text, lineHeight: 1.6 }}>{txt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Clinical Prompt Templates (click to copy) ────────────────────────────────
export function ClinicalPromptTemplatesBlock({ block, theme }: { block: ClinicalPromptTemplatesBlockType; theme: T; newsletter: any; onUpdateBlock: any }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCopy = (template: ClinicalPrompt) => {
    navigator.clipboard.writeText(template.prompt).then(() => {
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const categoryColors: Record<string, string> = {
    'Differential Diagnosis': theme.primary,
    'Discharge Summary': theme.secondary,
    'Literature Review': theme.accent,
    'Patient Education': '#00A651',
    'EEG / EMG Report': '#7B2D8B',
    'Research': '#F47920',
  };

  return (
    <div style={pad(28, 40)}>
      <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.accent, marginBottom: 8 }}>📎 Ready-to-Use Prompts</div>
      <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 26, color: theme.text, margin: '0 0 6px', fontWeight: 400 }}>{block.heading}</h2>
      <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.muted, margin: '0 0 20px' }}>{block.description}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {(block.templates || []).map((tpl) => {
          const isExpanded = expanded === tpl.id;
          const isCopied = copiedId === tpl.id;
          const catColor = categoryColors[tpl.category] || theme.primary;
          return (
            <div key={tpl.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, overflow: 'hidden', background: theme.surface, transition: 'box-shadow 0.15s' }}>
              <div style={{ padding: '12px 14px', borderBottom: isExpanded ? `1px solid ${theme.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontFamily: theme.fontMono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', padding: '2px 7px', background: catColor, borderRadius: 999 }}>{tpl.category}</span>
                    </div>
                    <div style={{ fontFamily: theme.fontBody, fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 3 }}>{tpl.title}</div>
                    <div style={{ fontFamily: theme.fontBody, fontSize: 11, color: theme.muted }}>{tpl.useCase}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setExpanded(isExpanded ? null : tpl.id)}
                      style={{ padding: '5px 8px', background: 'none', border: `1px solid ${theme.border}`, borderRadius: 6, fontFamily: theme.fontBody, fontSize: 11, color: theme.muted, cursor: 'pointer' }}>
                      {isExpanded ? 'Collapse' : 'Preview'}
                    </button>
                    <button onClick={() => handleCopy(tpl)}
                      style={{ padding: '5px 10px', background: isCopied ? theme.accent : theme.primary, border: 'none', borderRadius: 6, fontFamily: theme.fontBody, fontSize: 11, color: '#fff', cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}>
                      {isCopied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div style={{ padding: '10px 14px', background: theme.background }}>
                  <pre style={{ fontFamily: theme.fontMono, fontSize: 11, color: theme.text, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{tpl.prompt}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Term of Month ────────────────────────────────────────────────────────────
export function TermOfMonthBlock({ block, theme, editable, onUpdateBlock }: { block: TermOfMonthBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<TermOfMonthBlockType>) => void }) {
  return (
    <div style={pad(28, 40)}>
      <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.accent, marginBottom: 8 }}>📖 AI Term of the Month</div>
      <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 34, color: theme.text, margin: '0 0 20px', fontWeight: 400 }}>
        {editable ? <EditableText value={block.term || ''} placeholder="Term" onCommit={(v) => onUpdateBlock({ term: v })} style={{ display: 'block', width: '100%' }} /> : block.term}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[{ title: 'Definition', key: 'definition', content: block.definition }, { title: 'Relevance to Medicine', key: 'relevance', content: block.relevance }, { title: 'Neurology Application', key: 'neurologyApplication', content: block.neurologyApplication }].map(({ title, key, content }) => (
          <div key={title} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, background: theme.surface }}>
            <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.muted, marginBottom: 8 }}>{title}</div>
            <p style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.text, margin: 0, lineHeight: 1.6 }}>
              {editable ? (
                <EditableText value={content || ''} placeholder={title} multiline onCommit={(v) => onUpdateBlock({ [key]: v } as any)} style={{ minHeight: 18 }} />
              ) : (
                content
              )}
            </p>
          </div>
        ))}
      </div>
      {(block.relatedTerms || []).length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontFamily: theme.fontMono, fontSize: 10, color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center' }}>Related:</span>
          {block.relatedTerms.map(t => <span key={t} style={{ fontFamily: theme.fontBody, fontSize: 12, padding: '3px 10px', background: theme.background, border: `1px solid ${theme.border}`, borderRadius: 999, color: theme.muted }}>{t}</span>)}
        </div>
      )}
    </div>
  );
}

// ─── AI Case File (with image + source URL) ───────────────────────────────────
export function AiCaseFileBlock({ block, theme, editable, onUpdateBlock }: { block: AiCaseFileBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<AiCaseFileBlockType>) => void }) {
  const imgSrc = block.imageDataUrl || block.imageUrl;
  return (
    <div style={pad(28, 40)}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ background: theme.primary, borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: theme.fontDisplay, fontSize: 28, color: '#fff', lineHeight: 1, textShadow: '0 1px 0 rgba(0,0,0,0.18)' }}>
              {editable ? <EditableText value={block.year || ''} placeholder="Year" onCommit={(v) => onUpdateBlock({ year: v })} style={{ display: 'block', width: '100%', color: '#fff' }} /> : block.year}
            </div>
            <div style={{ fontFamily: theme.fontMono, fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>AI Case File</div>
          </div>
          {imgSrc && (
            <div style={{ width: 100, height: 80, borderRadius: 8, overflow: 'hidden', border: `1px solid ${theme.border}` }}>
              <img src={imgSrc} alt={block.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: theme.fontDisplay, fontSize: 22, color: theme.text, margin: '0 0 10px', fontWeight: 400 }}>
            {editable ? <EditableText value={block.title || ''} placeholder="Title" onCommit={(v) => onUpdateBlock({ title: v })} style={{ display: 'block', width: '100%' }} /> : block.title}
          </h3>
          <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.muted, margin: '0 0 12px', lineHeight: 1.65 }}>
            {editable ? <EditableText value={block.content || ''} placeholder="Content" multiline onCommit={(v) => onUpdateBlock({ content: v })} style={{ minHeight: 18, color: theme.muted }} /> : block.content}
          </p>
          {block.significance && (
            <div style={{ background: theme.background, borderRadius: 8, padding: '10px 14px', borderLeft: `3px solid ${theme.accent}`, marginBottom: 12 }}>
              <p style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.muted, margin: 0, lineHeight: 1.55 }}><strong>Significance:</strong> {block.significance}</p>
            </div>
          )}
          {(block.sourceUrl || block.sourceLabel) && (
            <div style={{ fontFamily: theme.fontMono, fontSize: 11, color: theme.muted }}>
              Source: {block.sourceUrl ? <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>{block.sourceLabel || block.sourceUrl}</a> : block.sourceLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Hits ───────────────────────────────────────────────────────────────
export function QuickHitsBlock({ block, theme, editable, onUpdateBlock }: { block: QuickHitsBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<QuickHitsBlockType>) => void }) {
  const updateHit = (id: string, changes: Partial<QuickHit>) => {
    const next = (block.hits || []).map(h => h.id === id ? { ...h, ...changes } : h);
    onUpdateBlock({ hits: next });
  };
  return (
    <div style={pad(24, 40)}>
      <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 26, color: theme.text, margin: '0 0 16px', fontWeight: 400 }}>
        ⚡{' '}
        {editable ? <EditableText value={block.heading || ''} placeholder="Heading" onCommit={(v) => onUpdateBlock({ heading: v })} style={{ display: 'block', width: '100%' }} /> : block.heading}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(block.hits || []).map((hit, i) => (
          <div key={hit.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 14px', border: `1px solid ${theme.border}`, borderRadius: 10, background: theme.surface }}>
            <span style={{ fontFamily: theme.fontMono, fontSize: 18, color: theme.accent, lineHeight: 1, flexShrink: 0, minWidth: 28 }}>{String(i + 1).padStart(2, '0')}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: theme.fontBody, fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4, lineHeight: 1.3 }}>
                {editable ? (
                  <EditableText value={hit.title || ''} placeholder="Title" onCommit={(v) => updateHit(hit.id, { title: v })} style={{ display: 'block', width: '100%' }} />
                ) : (
                  (hit.url ? <a href={hit.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.text, textDecoration: 'none' }}>{hit.title}</a> : hit.title)
                )}
              </div>
              <div style={{ fontFamily: theme.fontMono, fontSize: 10, color: theme.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                {editable ? <EditableText value={hit.source || ''} placeholder="Source" onCommit={(v) => updateHit(hit.id, { source: v })} style={{ display: 'block', width: '100%', color: theme.muted }} /> : hit.source}
              </div>
              <p style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.muted, margin: 0, lineHeight: 1.5 }}>
                {editable ? <EditableText value={hit.summary || ''} placeholder="Summary" multiline onCommit={(v) => updateHit(hit.id, { summary: v })} style={{ minHeight: 18, color: theme.muted }} /> : hit.summary}
              </p>
            </div>
            {hit.url && <a href={hit.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, fontFamily: theme.fontBody, fontSize: 11, color: theme.accent, fontWeight: 600, textDecoration: 'none' }}>Read →</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Humor (with optional image) ─────────────────────────────────────────────
export function HumorBlock({ block, theme, editable, onUpdateBlock }: { block: HumorBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<HumorBlockType>) => void }) {
  const imgSrc = block.imageDataUrl || block.imageUrl;
  const imgFit = block.imageFit || 'contain';
  const imgHeight = block.imageHeight; // undefined = auto (full image shown)

  return (
    <div style={pad(28, 40)}>
      <div style={{ background: `linear-gradient(135deg, ${theme.background}, ${theme.surface})`, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
        {/* Title */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>😄</span>
          <div style={{ fontFamily: theme.fontDisplay, fontSize: 20, color: theme.text, fontWeight: 400 }}>
            {editable ? (
              <EditableText value={block.heading || 'Humor'} placeholder="Humor" onCommit={(v) => onUpdateBlock({ heading: v })} style={{ display: 'block', width: '100%' }} />
            ) : (
              block.heading || 'Humor'
            )}
          </div>
        </div>

        {imgSrc && (
          <div style={{ position: 'relative' }}>
            <img
              src={imgSrc}
              alt="Humor block"
              style={{
                width: '100%',
                display: 'block',
                height: imgHeight ? `${imgHeight}px` : 'auto',
                objectFit: imgHeight ? imgFit : undefined,
              }}
            />
            {editable && (
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                display: 'flex', gap: 6, alignItems: 'center',
                background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '5px 10px',
              }}>
                <span style={{ fontFamily: theme.fontMono, fontSize: 10, color: '#fff', whiteSpace: 'nowrap' }}>
                  {imgHeight ? `${imgHeight}px` : 'Auto'}
                </span>
                <input
                  type="range" min={80} max={600} step={20}
                  value={imgHeight || 300}
                  onChange={e => onUpdateBlock({ imageHeight: Number(e.target.value) })}
                  style={{ width: 80, accentColor: theme.accent, cursor: 'pointer' }}
                  title="Drag to set image height"
                />
                <select
                  value={imgFit}
                  onChange={e => onUpdateBlock({ imageFit: e.target.value as any })}
                  style={{ fontFamily: theme.fontMono, fontSize: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 4px', cursor: 'pointer' }}
                  title="Image fit mode"
                >
                  <option value="contain">Fit (show all)</option>
                  <option value="cover">Fill (crop edges)</option>
                  <option value="fill">Stretch</option>
                </select>
                {imgHeight && (
                  <button
                    onClick={() => onUpdateBlock({ imageHeight: undefined as any })}
                    style={{ fontFamily: theme.fontMono, fontSize: 10, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
                    title="Reset to auto height (show full image)"
                  >
                    Auto ↩
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {/* Caption / punchline */}
        <div style={{ padding: '18px 22px', textAlign: 'center' }}>
          {!imgSrc && <div style={{ fontSize: 44, marginBottom: 10 }}>{block.emojiDecor || '😄'}</div>}
          <div style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.muted, marginBottom: 10 }}>
            {editable ? (
              <EditableText
                value={block.attribution || ''}
                placeholder="Short caption (optional)"
                onCommit={(v) => onUpdateBlock({ attribution: v })}
                style={{ display: 'block', width: '100%', color: theme.muted }}
              />
            ) : (
              block.attribution
            )}
          </div>
          <div style={{ fontFamily: theme.fontBody, fontSize: 16, color: theme.text, fontStyle: 'italic', lineHeight: 1.65, maxWidth: 760, margin: '0 auto' }}>
            {editable ? (
              <EditableText value={block.content || ''} placeholder="Punchline" multiline onCommit={(v) => onUpdateBlock({ content: v })} style={{ minHeight: 18 }} />
            ) : (
              block.content
            )}
          </div>
          {block.sourceUrl && (
            <div style={{ marginTop: 10 }}>
              <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: theme.fontBody, fontSize: 12, color: theme.accent, textDecoration: 'none' }}>Source ↗</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Spacer ───────────────────────────────────────────────────────────────────
export function SpacerBlock({ block, theme }: { block: SpacerBlockType; theme: T; newsletter: any; onUpdateBlock: any }) {
  return <div style={{ height: block.height, borderTop: block.showLine ? `1px ${block.lineStyle} ${theme.border}` : 'none', margin: block.showLine ? `0 40px` : 0 }} />;
}

// ─── AI Safety Monitor ────────────────────────────────────────────────────────
export function AiSafetyBlock({ block, theme, editable, onUpdateBlock }: { block: AiSafetyBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<AiSafetyBlockType>) => void }) {
  const updateUpdate = (id: string, changes: Partial<SafetyUpdate>) => {
    const next = (block.updates || []).map(u => u.id === id ? { ...u, ...changes } : u);
    onUpdateBlock({ updates: next });
  };
  const severityConfig = {
    critical: { color: '#C0392B', bg: '#FEF0EE', border: '#f5c6c0', label: 'CRITICAL', icon: '🔴' },
    high:     { color: '#C06500', bg: '#FFF4E6', border: '#F6D860', label: 'HIGH',     icon: '🟠' },
    medium:   { color: '#0057A8', bg: '#EEF4FF', border: '#C8D9EE', label: 'MEDIUM',   icon: '🔵' },
    informational: { color: '#005F6B', bg: '#F0FAFA', border: '#B2E0E4', label: 'INFO', icon: '⚪' },
  };

  return (
    <div style={pad(28, 40)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C0392B' }}>AI Safety Monitor</div>
          </div>
          <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 26, color: theme.text, margin: '0 0 4px', fontWeight: 400 }}>
            {editable ? <EditableText value={block.heading || ''} placeholder="Heading" onCommit={(v) => onUpdateBlock({ heading: v })} style={{ display: 'block', width: '100%' }} /> : block.heading}
          </h2>
          <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.muted, margin: 0 }}>
            {editable ? <EditableText value={block.subheading || ''} placeholder="Subheading" multiline onCommit={(v) => onUpdateBlock({ subheading: v })} style={{ minHeight: 18, color: theme.muted }} /> : block.subheading}
          </p>
        </div>
        {block.showLastUpdated && (
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, color: theme.muted, textAlign: 'right', lineHeight: 1.4 }}>
            Last updated<br />{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(block.updates || []).map((update) => {
          const sev = severityConfig[update.severity] || severityConfig.informational;
          return (
            <div key={update.id} style={{ border: `1px solid ${sev.border}`, borderRadius: 10, background: sev.bg, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
                  <span style={{ fontSize: 14 }}>{sev.icon}</span>
                  <span style={{ fontFamily: theme.fontMono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: sev.color, fontWeight: 700 }}>{sev.label}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: sev.color, padding: '2px 7px', background: sev.color + '18', borderRadius: 999 }}>
                      {editable ? <EditableText value={update.category || ''} placeholder="Category" onCommit={(v) => updateUpdate(update.id, { category: ((['FDA','Policy','Incident','Guideline','Alert','Research'] as const).includes(v as any) ? (v as any) : undefined) })} style={{ display: 'block', width: '100%', color: sev.color }} /> : update.category}
                    </span>
                    <span style={{ fontFamily: theme.fontMono, fontSize: 10, color: theme.muted }}>
                      {editable ? <EditableText value={update.date || ''} placeholder="Date" onCommit={(v) => updateUpdate(update.id, { date: v })} style={{ display: 'block', width: '100%', color: theme.muted }} /> : update.date}
                    </span>
                  </div>
                  <div style={{ fontFamily: theme.fontBody, fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>
                    {editable ? (
                      <EditableText value={update.title || ''} placeholder="Title" onCommit={(v) => updateUpdate(update.id, { title: v })} style={{ display: 'block', width: '100%' }} />
                    ) : (
                      (update.url ? <a href={update.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.text, textDecoration: 'none' }}>{update.title}</a> : update.title)
                    )}
                  </div>
                  <p style={{ fontFamily: theme.fontBody, fontSize: 13, color: theme.muted, margin: 0, lineHeight: 1.55 }}>
                    {editable ? <EditableText value={update.summary || ''} placeholder="Summary" multiline onCommit={(v) => updateUpdate(update.id, { summary: v })} style={{ minHeight: 18, color: theme.muted }} /> : update.summary}
                  </p>
                  {update.url && <a href={update.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontFamily: theme.fontBody, fontSize: 11, color: sev.color, fontWeight: 600 }}>View full guidance →</a>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Northwell Spotlight ──────────────────────────────────────────────────────
export function NorthwellSpotlightBlock({ block, theme }: { block: NorthwellSpotlightBlockType; theme: T; newsletter: any; onUpdateBlock: any }) {
  return (
    <div style={pad(28, 40)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, background: theme.primary, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🏥</span>
        </div>
        <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.primary }}>Northwell Health</div>
      </div>
      <h2 style={{ fontFamily: theme.fontDisplay, fontSize: 26, color: theme.text, margin: '0 0 4px', fontWeight: 400 }}>{block.heading}</h2>
      {block.subheading && <p style={{ fontFamily: theme.fontBody, fontSize: 14, color: theme.muted, margin: '0 0 20px' }}>{block.subheading}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {(block.items || []).slice(0, block.maxItems || 6).map((item) => (
          <div key={item.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, overflow: 'hidden', background: theme.surface, display: 'flex', flexDirection: 'column' }}>
            {item.imageUrl && <div style={{ height: 120, overflow: 'hidden' }}><img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
            <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
              {item.category && <span style={{ fontFamily: theme.fontMono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.accent, marginBottom: 6, display: 'block' }}>{item.category}</span>}
              <div style={{ fontFamily: theme.fontBody, fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 6, lineHeight: 1.35, flex: 1, minWidth: 0 }}>
                {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.text, textDecoration: 'none' }}>{item.title}</a> : item.title}
              </div>
              {item.summary && <p style={{ fontFamily: theme.fontBody, fontSize: 12, color: theme.muted, margin: '0 0 8px', lineHeight: 1.5 }}>{item.summary}</p>}
              {item.pubDate && <div style={{ fontFamily: theme.fontMono, fontSize: 10, color: theme.muted }}>{new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
              {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8, fontFamily: theme.fontBody, fontSize: 11, color: theme.accent, fontWeight: 600, textDecoration: 'none' }}>Read more →</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RSS Sidebar Panel ────────────────────────────────────────────────────────
export function RssSidebarBlock({ block, theme, editable, onUpdateBlock }: { block: RssSidebarBlockType; theme: T; editable?: boolean; newsletter: any; onUpdateBlock: (c: Partial<RssSidebarBlockType>) => void }) {
  const PROXY = 'https://api.allorigins.win/get?url=';
  const [liveItems, setLiveItems] = useState(block.items || []);
  const [liveFetched, setLiveFetched] = useState(block.lastFetched || '');

  const parseXml = useCallback((xml: string, feedLabel: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      if (doc.querySelector('parsererror')) return [] as { title: string; url: string; source: string; pubDate: string }[];

      const rssItems = Array.from(doc.querySelectorAll('item'));
      if (rssItems.length) {
        return rssItems.map(el => ({
          title: el.querySelector('title')?.textContent?.trim() || '',
          url: el.querySelector('link')?.textContent?.trim() || '',
          pubDate: el.querySelector('pubDate')?.textContent?.trim() || '',
          source: el.querySelector('source')?.textContent?.trim() || feedLabel,
        })).filter(x => !!x.title);
      }

      const atomEntries = Array.from(doc.querySelectorAll('entry'));
      return atomEntries.map(el => ({
        title: el.querySelector('title')?.textContent?.trim() || '',
        url: el.querySelector('link')?.getAttribute('href') || el.querySelector('link')?.textContent?.trim() || '',
        pubDate: el.querySelector('updated')?.textContent?.trim() || el.querySelector('published')?.textContent?.trim() || '',
        source: doc.querySelector('feed > title')?.textContent?.trim() || feedLabel,
      })).filter(x => !!x.title);
    } catch {
      return [];
    }
  }, []);

  // Live fetch at runtime (preview/export) + keep last fetch snapshot in JSON when editable.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!block.refreshOnView) return;
      const urls = (block.feedUrls || []).filter(Boolean);
      if (!urls.length) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

      const all: { title: string; url: string; source: string; pubDate: string }[] = [];
      for (const url of urls) {
        try {
          const res = await fetch(PROXY + encodeURIComponent(url), { cache: 'no-store' });
          if (!res.ok) continue;
          const data = await res.json();
          const xml = (data && typeof data.contents === 'string') ? data.contents : '';
          all.push(...parseXml(xml, url));
        } catch {
          // ignore per-feed errors
        }
      }

      // Deduplicate by URL
      const seen = new Set<string>();
      const deduped = all.filter(it => {
        if (!it.url || seen.has(it.url)) return false;
        seen.add(it.url);
        return true;
      });

      // Sort by date desc
      deduped.sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0));

      const now = new Date().toISOString();
      if (cancelled) return;

      setLiveItems(deduped);
      setLiveFetched(now);

      // Persist snapshot when editable (builder) so exports can render the last fetch if offline.
      if (editable) {
        onUpdateBlock({ items: deduped, lastFetched: now });
      }
    }
    run();
    return () => { cancelled = true; };
  }, [editable, onUpdateBlock, block.refreshOnView, (block.feedUrls || []).join('|'), parseXml]);

  const itemsToShow = (liveItems && liveItems.length) ? liveItems : (block.items || []);
  const fetchedToShow = liveFetched || block.lastFetched;

  return (
    <div style={{ padding: '24px 40px' }}>
      <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden', background: theme.surface }}>
        {/* Header */}
        <div style={{ background: theme.primary, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📰</span>
          <span style={{ fontFamily: theme.fontMono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>{block.heading}</span>
          {fetchedToShow && <span style={{ marginLeft: 'auto', fontFamily: theme.fontMono, fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Updated {new Date(fetchedToShow).toLocaleDateString()}</span>}
        </div>
        {/* Items */}
        <div className="nap-rss-scroll" style={{ maxHeight: block.enableScroll ? 420 : 'none', overflowY: block.enableScroll ? 'auto' as any : 'visible' as any }}>
          {(itemsToShow || []).length === 0 ? (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: theme.muted, fontFamily: theme.fontBody, fontSize: 13 }}>
              No feed items yet — configure feeds in Block Settings and refresh.
            </div>
          ) : (
            (itemsToShow || []).slice(0, block.maxItems || 8).map((item, i) => (
              <div key={i} style={{ padding: '11px 18px', borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: theme.fontMono, fontSize: 12, color: theme.accent, flexShrink: 0, minWidth: 20, marginTop: 1 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: theme.fontBody, fontSize: 13, fontWeight: 600, color: theme.text, lineHeight: 1.3, marginBottom: 3 }}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.text, textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = theme.accent}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = theme.text}>
                        {item.title}
                      </a>
                    ) : item.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {item.source && <span style={{ fontFamily: theme.fontMono, fontSize: 9, color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.source}</span>}
                    {item.pubDate && <span style={{ fontFamily: theme.fontMono, fontSize: 9, color: theme.muted }}>{new Date(item.pubDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, fontFamily: theme.fontBody, fontSize: 11, color: theme.accent, fontWeight: 600, textDecoration: 'none', paddingTop: 1 }}>↗</a>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export function FooterBlock({ block, theme }: { block: FooterBlockType; theme: T; newsletter: any; onUpdateBlock: any }) {
  const contactHref = `mailto:yelsherif@northwell.edu?subject=${encodeURIComponent('Neurology AI Pulse Newsletter Suggestions/Comments')}`;

  return (
    <div className="nap-white-section" style={{ background: theme.primary, padding: '44px 40px 36px', textAlign: 'center', color: '#fff' }}>
      {(block.nextIssueDate || block.nextIssueTeaser) && (
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 20px', marginBottom: 28, display: 'inline-block' }}>
          <div style={{ fontFamily: theme.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>Next Issue</div>
          <div style={{ fontFamily: theme.fontBody, fontSize: 14, color: '#fff' }}>{block.nextIssueDate}{block.nextIssueTeaser ? ` · ${block.nextIssueTeaser}` : ''}</div>
        </div>
      )}

      <div style={{ fontFamily: theme.fontDisplay, fontSize: 22, color: '#fff', marginBottom: 4, fontWeight: 400 }}>{block.institution}</div>
      <div style={{ fontFamily: theme.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>{block.department}</div>
      {block.editors && <div style={{ fontFamily: theme.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 22 }}>{block.editors}</div>}

      {/* Contact Us only (per newsletter spec) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
        <a
          href={contactHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: theme.fontBody,
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            textDecoration: 'none',
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.10)',
          }}
        >
          Contact Us
          <span style={{ opacity: 0.8 }}>✉️</span>
        </a>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.18)', maxWidth: 240, margin: '0 auto 18px' }} />

      <p style={{ fontFamily: theme.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '0 0 8px', maxWidth: 580, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>{block.disclaimer}</p>
      <p style={{ fontFamily: theme.fontMono, fontSize: 10, color: 'rgba(255,255,255,0.65)', margin: 0, letterSpacing: '0.1em' }}>© {block.copyrightYear} {block.institution}</p>
    </div>
  );
}
