import React, { useState } from 'react';
import { Layers, Settings, Rss, Palette, Download, RefreshCw, Plus, Trash2, RotateCcw, X, ExternalLink } from 'lucide-react';
import type { Newsletter, BlockType, ThemePreset, EditorState, Block, SaveVersion, RssFeedConfig, RssItem, Article, QuickHit } from '../../types';
import { BLOCK_LABELS, BLOCK_DEFAULTS } from '../../data/defaults';
import { THEMES } from '../../data/themes';
import { BlockSettingsPanel } from './BlockSettingsPanel';

interface Props {
  newsletter: Newsletter;
  editorState: EditorState;
  rss: {
    feeds: RssFeedConfig[]; items: RssItem[]; loading: boolean; errors: string[];
    filter: string; refresh: () => void; setFilter: (f: string) => void;
    addFeed: (url: string, label: string) => void; removeFeed: (url: string) => void; toggleFeed: (url: string) => void;
  };
  versions: SaveVersion[];
  onSetPanel: (panel: EditorState['activePanel']) => void;
  onAddBlock: (type: BlockType, afterId?: string) => void;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, changes: Partial<Block>) => void;
  onUpdateTheme: (theme: ThemePreset) => void;
  onRestoreVersion: (v: SaveVersion) => void;
  onDeleteVersion: (id: string) => void;
  onAddArticle: (blockId: string) => void;
  onUpdateArticle: (blockId: string, articleId: string, changes: Partial<Article>) => void;
  onDeleteArticle: (blockId: string, articleId: string) => void;
  onAddQuickHit: (blockId: string) => void;
  onUpdateQuickHit: (blockId: string, hitId: string, changes: Partial<QuickHit>) => void;
  onDeleteQuickHit: (blockId: string, hitId: string) => void;
}

const PANELS: { id: EditorState['activePanel']; icon: React.ReactNode; label: string }[] = [
  { id: 'blocks',   icon: <Layers size={16} />,     label: 'Blocks' },
  { id: 'settings', icon: <Settings size={16} />,   label: 'Settings' },
  { id: 'rss',      icon: <Rss size={16} />,        label: 'RSS' },
  { id: 'theme',    icon: <Palette size={16} />,    label: 'Theme' },
  { id: 'export',   icon: <Download size={16} />,   label: 'Versions' },
];

const BLOCK_GROUPS: { label: string; types: BlockType[] }[] = [
  { label: 'Structure', types: ['header', 'ticker', 'section-divider', 'spacer', 'footer'] },
  { label: 'Content', types: ['article-grid', 'spotlight', 'ethics-split', 'quick-hits', 'text', 'image', 'html-embed'] },
  { label: 'Clinical AI Skills', types: ['prompt-masterclass', 'sbar-prompt', 'clinical-prompt-templates', 'term-of-month', 'ai-case-file', 'humor'] },
  { label: 'Safety & Institutional', types: ['ai-safety', 'northwell-spotlight', 'rss-sidebar'] },
];

export function Sidebar(props: Props) {
  const { newsletter, editorState, rss, versions, onSetPanel } = props;
  const { activePanel, selectedBlockId } = editorState;
  const selectedBlock = selectedBlockId ? newsletter.blocks[selectedBlockId] : null;

  return (
    <div style={{
      width: 320, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}>
      {/* Panel tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}>
        {PANELS.map(p => (
          <button key={p.id} onClick={() => onSetPanel(p.id)}
            title={p.label}
            style={{
              flex: 1, padding: '10px 4px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activePanel === p.id ? 'var(--color-accent)' : 'var(--color-muted)',
              borderBottom: activePanel === p.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}>
            {p.icon}
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Panel body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        {activePanel === 'blocks' && (
          selectedBlock
            ? <BlockSettingsPanel
                block={selectedBlock}
                newsletter={newsletter}
                onClose={() => props.onSelectBlock(null)}
                onUpdateBlock={props.onUpdateBlock}
                onAddArticle={props.onAddArticle}
                onUpdateArticle={props.onUpdateArticle}
                onDeleteArticle={props.onDeleteArticle}
                onAddQuickHit={props.onAddQuickHit}
                onUpdateQuickHit={props.onUpdateQuickHit}
                onDeleteQuickHit={props.onDeleteQuickHit}
              />
            : <BlockPickerPanel onAddBlock={props.onAddBlock} />
        )}
        {activePanel === 'settings' && <SettingsPanel newsletter={newsletter} onUpdateMeta={() => {}} />}
        {activePanel === 'rss' && <RssPanel rss={rss} onAddToNewsletter={(item) => {
          // Add as article to first article-grid block
          const gridId = newsletter.blockOrder.find(id => newsletter.blocks[id]?.type === 'article-grid');
          if (gridId) {
            props.onAddArticle(gridId);
            // Note: we'd need to also pre-fill it, which requires a different dispatch
          }
        }} />}
        {activePanel === 'theme' && <ThemePanel current={newsletter.theme} onUpdateTheme={props.onUpdateTheme} />}
        {activePanel === 'export' && <VersionsPanel versions={versions} onRestore={props.onRestoreVersion} onDelete={props.onDeleteVersion} />}
      </div>
    </div>
  );
}

// ─── Block Picker ─────────────────────────────────────────────────────────────

function BlockPickerPanel({ onAddBlock }: { onAddBlock: (t: BlockType) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-text)', margin: '0 0 4px' }}>Add Block</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>
          Click to add at the end. Select a block in the canvas to insert after it.
        </p>
      </div>
      {BLOCK_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--color-muted)',
            marginBottom: 8, paddingBottom: 6,
            borderBottom: '1px solid var(--color-border)',
          }}>
            {group.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {group.types.map(type => (
              <button key={type} onClick={() => onAddBlock(type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  background: 'none', border: '1px solid var(--color-border)',
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  color: 'var(--color-text)',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-bg)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                }}
              >
                <span style={{ fontSize: 16 }}>{BLOCK_LABELS[type].split('  ')[0]}</span>
                <span>{BLOCK_LABELS[type].split('  ').slice(1).join('').trim()}</span>
                <Plus size={12} style={{ marginLeft: 'auto', color: 'var(--color-muted)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel({ newsletter, onUpdateMeta }: { newsletter: Newsletter; onUpdateMeta: (c: any) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-text)', margin: '0 0 16px' }}>Issue Settings</h3>
      <Field label="Issue Title">
        <input style={inputStyle} defaultValue={newsletter.meta.title}
          onBlur={e => onUpdateMeta({ title: e.target.value })} />
      </Field>
      <Field label="Issue Number">
        <input style={inputStyle} defaultValue={newsletter.meta.issueNumber}
          onBlur={e => onUpdateMeta({ issueNumber: e.target.value })} />
      </Field>
    </div>
  );
}

// ─── RSS Panel ────────────────────────────────────────────────────────────────

function RssPanel({ rss, onAddToNewsletter }: { rss: Props['rss']; onAddToNewsletter: (item: RssItem) => void }) {
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-text)', margin: 0 }}>RSS Feeds</h3>
        <button onClick={rss.refresh} disabled={rss.loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--color-accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', opacity: rss.loading ? 0.6 : 1 }}>
          <RefreshCw size={12} style={{ animation: rss.loading ? 'spin 1s linear infinite' : 'none' }} />
          {rss.loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Feed list */}
      <div style={{ marginBottom: 16 }}>
        {rss.feeds.map(feed => (
          <div key={feed.url} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
            <input type="checkbox" checked={feed.enabled} onChange={() => rss.toggleFeed(feed.url)}
              style={{ accentColor: 'var(--color-accent)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={feed.url}>
              {feed.label}
            </span>
            <button onClick={() => rss.removeFeed(feed.url)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2, display: 'flex', alignItems: 'center' }}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Add feed */}
      <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 8 }}>Add Feed</div>
        <input placeholder="RSS URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} style={{ ...inputStyle, marginBottom: 6 }} />
        <input placeholder="Label" value={newLabel} onChange={e => setNewLabel(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
        <button onClick={() => { if (newUrl) { rss.addFeed(newUrl, newLabel || newUrl); setNewUrl(''); setNewLabel(''); } }}
          style={{ width: '100%', padding: '7px 0', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
          + Add Feed
        </button>
      </div>

      {/* Filter + items */}
      {rss.items.length > 0 && (
        <>
          <input placeholder="Filter articles…" value={rss.filter} onChange={e => rss.setFilter(e.target.value)}
            style={{ ...inputStyle, marginBottom: 12 }} />
          {rss.errors.map((err, i) => (
            <div key={i} style={{ background: '#FEF0EE', border: '1px solid #f5c6c0', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: '#7A1E12' }}>
              ⚠ {err}
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rss.items.slice(0, 30).map((item, i) => (
              <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10, background: 'var(--color-surface)' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4, lineHeight: 1.35 }}>
                  {item.title}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', marginBottom: 6 }}>
                  {item.source} · {item.pubDate ? new Date(item.pubDate).toLocaleDateString() : ''}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => onAddToNewsletter(item)}
                    style={{ flex: 1, padding: '5px 0', background: 'var(--color-accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                    + Add to Issue
                  </button>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-muted)', fontSize: 11 }}>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {rss.items.length === 0 && !rss.loading && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
          Press Refresh to load articles
        </div>
      )}
    </div>
  );
}

// ─── Theme Panel ──────────────────────────────────────────────────────────────

function ThemePanel({ current, onUpdateTheme }: { current: ThemePreset; onUpdateTheme: (t: ThemePreset) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-text)', margin: '0 0 16px' }}>Theme</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {THEMES.map(theme => (
          <button key={theme.id} onClick={() => onUpdateTheme(theme)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 12,
              background: current.id === theme.id ? 'var(--color-bg)' : 'var(--color-surface)',
              border: `2px solid ${current.id === theme.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 10, cursor: 'pointer', textAlign: 'left',
            }}>
            {/* Color swatches */}
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {[theme.primary, theme.accent, theme.background, theme.surface].map((c, i) => (
                <div key={i} style={{ width: 14, height: 14, background: c, borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)' }} />
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>{theme.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.08em' }}>{theme.primary} · {theme.accent}</div>
            </div>
            {current.id === theme.id && (
              <div style={{ marginLeft: 'auto', width: 8, height: 8, background: 'var(--color-accent)', borderRadius: '50%' }} />
            )}
          </button>
        ))}
      </div>

      {/* Custom colors */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 12 }}>Customize</div>
        {[
          ['Primary', 'primary' as keyof ThemePreset],
          ['Accent', 'accent' as keyof ThemePreset],
          ['Background', 'background' as keyof ThemePreset],
          ['Surface', 'surface' as keyof ThemePreset],
        ].map(([label, key]) => (
          <div key={String(key)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <input type="color" value={String(current[key as keyof ThemePreset])}
              onChange={e => onUpdateTheme({ ...current, [key]: e.target.value })}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--color-border)', padding: 2, cursor: 'pointer' }} />
            <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text)' }}>{label as string}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
              {String(current[key as keyof ThemePreset])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Versions Panel ───────────────────────────────────────────────────────────

function VersionsPanel({ versions, onRestore, onDelete }: { versions: SaveVersion[]; onRestore: (v: SaveVersion) => void; onDelete: (id: string) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-text)', margin: '0 0 4px' }}>Saved Versions</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-muted)', margin: '0 0 16px' }}>Up to 20 versions stored in browser.</p>
      {versions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
          No saved versions yet. Use Save Version in the toolbar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {versions.map(v => (
            <div key={v.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{v.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', marginBottom: 10 }}>
                {new Date(v.createdAt).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => onRestore(v)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 0', background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                  <RotateCcw size={11} /> Restore
                </button>
                <button onClick={() => { if (confirm('Delete this version?')) onDelete(v.id); }}
                  style={{ padding: '6px 10px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
  borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13,
  color: 'var(--color-text)', outline: 'none',
  boxSizing: 'border-box',
};

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 80, resize: 'vertical',
  fontFamily: 'var(--font-body)', lineHeight: 1.5,
};
