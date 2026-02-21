import React, { useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Block, Newsletter, Article, QuickHit } from '../../types';
import { Field, inputStyle, textareaStyle } from './Sidebar';

interface Props {
  block: Block;
  newsletter: Newsletter;
  onClose: () => void;
  onUpdateBlock: (id: string, changes: Partial<Block>) => void;
  onAddArticle: (blockId: string) => void;
  onUpdateArticle: (blockId: string, articleId: string, changes: Partial<Article>) => void;
  onDeleteArticle: (blockId: string, articleId: string) => void;
  onAddQuickHit: (blockId: string) => void;
  onUpdateQuickHit: (blockId: string, hitId: string, changes: Partial<QuickHit>) => void;
  onDeleteQuickHit: (blockId: string, hitId: string) => void;
}

export function BlockSettingsPanel({ block, onClose, onUpdateBlock, onAddArticle, onUpdateArticle, onDeleteArticle, onAddQuickHit, onUpdateQuickHit, onDeleteQuickHit }: Props) {
  const upd = (changes: Partial<Block>) => onUpdateBlock(block.id, changes);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Block Settings</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4, borderRadius: 4 }}><X size={16} /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Route to per-block settings */}
        {block.type === 'header' && <HeaderSettings block={block as any} upd={upd} />}
        {block.type === 'ticker' && <TickerSettingsExtended block={block as any} upd={upd} />}
        {block.type === 'section-divider' && <DividerSettings block={block as any} upd={upd} />}
        {block.type === 'article-grid' && (
          <ArticleGridSettings block={block as any} upd={upd}
            onAddArticle={() => onAddArticle(block.id)}
            onUpdateArticle={(aid: string, c: Partial<Article>) => onUpdateArticle(block.id, aid, c)}
            onDeleteArticle={(aid: string) => onDeleteArticle(block.id, aid)} />
        )}
        {block.type === 'spotlight' && (
          <SpotlightSettings block={block as any} upd={upd}
            onUpdateArticle={(aid: string, changes: Partial<Article>) => onUpdateArticle(block.id, aid, changes)} />
        )}
        {block.type === 'ethics-split' && <EthicsSettings block={block as any} upd={upd} />}
        {block.type === 'image' && <ImageSettings block={block as any} upd={upd} />}
        {block.type === 'text' && <TextSettings block={block as any} upd={upd} />}
        {block.type === 'html-embed' && <HtmlSettings block={block as any} upd={upd} />}
        {block.type === 'prompt-masterclass' && <PromptSettings block={block as any} upd={upd} />}
        {block.type === 'sbar-prompt' && <SbarSettings block={block as any} upd={upd} />}
        {block.type === 'term-of-month' && <TermSettings block={block as any} upd={upd} />}
        {block.type === 'ai-case-file' && <AiCaseFileSettingsExtended block={block as any} upd={upd} />}
        {block.type === 'quick-hits' && (
          <QuickHitsSettings block={block as any} upd={upd}
            onAddHit={() => onAddQuickHit(block.id)}
            onUpdateHit={(hid: string, changes: Partial<QuickHit>) => onUpdateQuickHit(block.id, hid, changes)}
            onDeleteHit={(hid: string) => onDeleteQuickHit(block.id, hid)} />
        )}
        {block.type === 'humor' && <HumorSettingsExtended block={block as any} upd={upd} />}
        {block.type === 'spacer' && <SpacerSettings block={block as any} upd={upd} />}
        {block.type === 'footer' && <FooterSettings block={block as any} upd={upd} />}
        {block.type === 'northwell-spotlight' && <NorthwellSpotlightSettings block={block as any} upd={upd} />}
        {block.type === 'rss-sidebar' && <RssSidebarSettings block={block as any} upd={upd} />}
        {block.type === 'clinical-prompt-templates' && <ClinicalPromptTemplateSettings block={block as any} upd={upd} />}
      </div>
    </div>
  );
}

// ─── Individual block settings ────────────────────────────────────────────────
function HeaderSettings({ block, upd }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (<>
    <Field label="Title"><input style={inputStyle} value={block.title} onChange={e => upd({ title: e.target.value })} /></Field>
    <Field label="Subtitle"><input style={inputStyle} value={block.subtitle} onChange={e => upd({ subtitle: e.target.value })} /></Field>
    <Field label="Issue Number"><input style={inputStyle} value={block.issueNumber} onChange={e => upd({ issueNumber: e.target.value })} /></Field>
    <Field label="Issue Date"><input style={inputStyle} value={block.issueDate} onChange={e => upd({ issueDate: e.target.value })} /></Field>
    <Field label="Tagline"><textarea style={textareaStyle} value={block.tagline} onChange={e => upd({ tagline: e.target.value })} /></Field>
    <Field label="Background Style">
      <select style={inputStyle} value={block.backgroundStyle} onChange={e => upd({ backgroundStyle: e.target.value })}>
        <option value="gradient">Gradient</option>
        <option value="solid">Solid</option>
        <option value="mesh">Mesh</option>
        <option value="wave">Wave</option>
      </select>
    </Field>
    <Field label="Logo URL"><input style={inputStyle} value={block.logoUrl} onChange={e => upd({ logoUrl: e.target.value })} placeholder="https://…" /></Field>
    <Field label="Logo Upload">
      <button onClick={() => fileRef.current?.click()}
        style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', color: 'var(--color-muted)' }}>
        Click to upload image
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
        const f = e.target.files?.[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => upd({ logoDataUrl: ev.target?.result as string });
        reader.readAsDataURL(f);
      }} />
      {block.logoDataUrl && <div style={{ marginTop: 8, padding: 8, background: 'var(--color-bg)', borderRadius: 8, textAlign: 'center' }}><img src={block.logoDataUrl} alt="Logo" style={{ maxHeight: 48, maxWidth: '100%' }} /></div>}
    </Field>
  </>);
}

function TickerSettings({ block, upd }: any) {
  const items: string[] = block.items || [];
  return (<>
    <Field label="Speed">
      <select style={inputStyle} value={block.speed} onChange={e => upd({ speed: e.target.value })}>
        <option value="slow">Slow</option>
        <option value="medium">Medium</option>
        <option value="fast">Fast</option>
      </select>
    </Field>
    <Field label="Background"><input type="color" value={block.backgroundColor} onChange={e => upd({ backgroundColor: e.target.value })} /></Field>
    <Field label="Text Color"><input type="color" value={block.textColor} onChange={e => upd({ textColor: e.target.value })} /></Field>
    <Field label={`Headlines (${items.length})`} hint="One per line">
      <textarea style={{ ...textareaStyle, minHeight: 140 }} value={items.join('\n')} onChange={e => upd({ items: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} />
    </Field>
  </>);
}

function DividerSettings({ block, upd }: any) {
  return (<>
    <Field label="Label"><input style={inputStyle} value={block.label} onChange={e => upd({ label: e.target.value })} /></Field>
    <Field label="Number"><input style={inputStyle} type="number" value={block.number} onChange={e => upd({ number: Number(e.target.value) })} /></Field>
    <Field label="Description"><textarea style={textareaStyle} value={block.description} onChange={e => upd({ description: e.target.value })} /></Field>
    <Field label="Style">
      <select style={inputStyle} value={block.style} onChange={e => upd({ style: e.target.value })}>
        <option value="gradient">Gradient</option>
        <option value="line">Line</option>
        <option value="bold">Bold</option>
        <option value="numbered">Numbered</option>
      </select>
    </Field>
  </>);
}

function ArticleField({ article, onUpdate, onDelete }: { article: Article; onUpdate: (c: Partial<Article>) => void; onDelete: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Article</span>
        <button onClick={onDelete} style={{ background: '#FEF0EE', border: '1px solid #f5c6c0', borderRadius: 6, color: '#7A1E12', cursor: 'pointer', padding: '3px 8px', fontSize: 11, fontFamily: 'var(--font-body)' }}>
          Delete
        </button>
      </div>
      <Field label="Title"><input style={inputStyle} value={article.title} onChange={e => onUpdate({ title: e.target.value })} /></Field>
      <Field label="URL"><input style={inputStyle} value={article.url} onChange={e => onUpdate({ url: e.target.value })} placeholder="https://…" /></Field>
      <Field label="Source / Journal"><input style={inputStyle} value={article.source} onChange={e => onUpdate({ source: e.target.value })} /></Field>
      <Field label="Date"><input style={inputStyle} type="date" value={article.pubDate} onChange={e => onUpdate({ pubDate: e.target.value })} /></Field>
      <Field label="Image URL"><input style={inputStyle} value={article.imageUrl} onChange={e => onUpdate({ imageUrl: e.target.value })} placeholder="https://… (optional)" /></Field>
      <Field label="Upload Image">
        <button onClick={() => fileRef.current?.click()} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', color: 'var(--color-muted)' }}>Upload image</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
          const f = e.target.files?.[0]; if (!f) return;
          const reader = new FileReader();
          reader.onload = ev => onUpdate({ imageUrl: ev.target?.result as string });
          reader.readAsDataURL(f);
        }} />
      </Field>
      <Field label="Summary"><textarea style={textareaStyle} value={article.summary} onChange={e => onUpdate({ summary: e.target.value })} /></Field>
      <Field label="Clinical Context"><textarea style={textareaStyle} value={article.clinicalContext} onChange={e => onUpdate({ clinicalContext: e.target.value })} /></Field>
      <Field label="My Take"><textarea style={{ ...textareaStyle, minHeight: 60 }} value={article.myTake} onChange={e => onUpdate({ myTake: e.target.value })} /></Field>
      <Field label="Evidence Level">
        <select style={inputStyle} value={article.evidenceLevel} onChange={e => onUpdate({ evidenceLevel: e.target.value as any })}>
          <option value="">—</option>
          <option>High</option><option>Moderate</option><option>Low</option><option>Expert Opinion</option>
        </select>
      </Field>
    </div>
  );
}

function ArticleGridSettings({ block, upd, onAddArticle, onUpdateArticle, onDeleteArticle }: any) {
  return (<>
    <Field label="Section Title"><input style={inputStyle} value={block.sectionTitle} onChange={e => upd({ sectionTitle: e.target.value })} /></Field>
    <Field label="Columns">
      <select style={inputStyle} value={block.columns} onChange={e => upd({ columns: Number(e.target.value) })}>
        <option value={1}>1 column</option><option value={2}>2 columns</option><option value={3}>3 columns</option>
      </select>
    </Field>
    <Field label="Layout">
      <select style={inputStyle} value={block.layout} onChange={e => upd({ layout: e.target.value })}>
        <option value="card">Card</option><option value="editorial">Editorial</option><option value="compact">Compact</option>
      </select>
    </Field>
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{block.articles?.length || 0} Articles</span>
        <button onClick={onAddArticle}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--color-accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
          <Plus size={11} /> Add Article
        </button>
      </div>
      {(block.articles || []).map((art: Article) => (
        <ArticleField key={art.id} article={art}
          onUpdate={c => onUpdateArticle(art.id, c)}
          onDelete={() => onDeleteArticle(art.id)} />
      ))}
    </div>
  </>);
}

function SpotlightSettings({ block, upd, onUpdateArticle }: any) {
  return (<>
    <Field label="Layout">
      <select style={inputStyle} value={block.layout} onChange={e => upd({ layout: e.target.value })}>
        <option value="left-image">Image Left</option><option value="right-image">Image Right</option>
        <option value="top-image">Image Top</option><option value="no-image">No Image</option>
      </select>
    </Field>
    <Field label="Accent Color"><input type="color" value={block.accentColor} onChange={e => upd({ accentColor: e.target.value })} /></Field>
    <div style={{ marginTop: 8 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Article</div>
      <ArticleField article={block.article}
        onUpdate={c => onUpdateArticle(block.article.id, c)}
        onDelete={() => {}} />
    </div>
  </>);
}

function EthicsSettings({ block, upd }: any) {
  return (<>
    <Field label="Heading"><input style={inputStyle} value={block.heading} onChange={e => upd({ heading: e.target.value })} /></Field>
    <Field label="Subheading"><input style={inputStyle} value={block.subheading} onChange={e => upd({ subheading: e.target.value })} /></Field>
    <Field label="Source / Publication"><input style={inputStyle} value={block.source} onChange={e => upd({ source: e.target.value })} /></Field>
    <Field label="URL"><input style={inputStyle} value={block.url} onChange={e => upd({ url: e.target.value })} placeholder="https://…" /></Field>
    <Field label="Left Title"><input style={inputStyle} value={block.leftTitle} onChange={e => upd({ leftTitle: e.target.value })} /></Field>
    <Field label="Left Content"><textarea style={textareaStyle} value={block.leftContent} onChange={e => upd({ leftContent: e.target.value })} /></Field>
    <Field label="Right Title"><input style={inputStyle} value={block.rightTitle} onChange={e => upd({ rightTitle: e.target.value })} /></Field>
    <Field label="Right Content"><textarea style={textareaStyle} value={block.rightContent} onChange={e => upd({ rightContent: e.target.value })} /></Field>
    <Field label="Clinical Perspective"><textarea style={textareaStyle} value={block.clinicalPerspective} onChange={e => upd({ clinicalPerspective: e.target.value })} /></Field>
  </>);
}

function ImageSettings({ block, upd }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (<>
    <Field label="Image URL"><input style={inputStyle} value={block.url} onChange={e => upd({ url: e.target.value })} placeholder="https://…" /></Field>
    <Field label="Upload Image">
      <button onClick={() => fileRef.current?.click()}
        style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', color: 'var(--color-muted)' }}>
        {block.dataUrl ? '✓ Image uploaded — click to replace' : 'Click to upload image'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
        const f = e.target.files?.[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => upd({ dataUrl: ev.target?.result as string });
        reader.readAsDataURL(f);
      }} />
    </Field>
    {(block.dataUrl || block.url) && (
      <div style={{ marginBottom: 14, padding: 8, background: 'var(--color-bg)', borderRadius: 8, textAlign: 'center' }}>
        <img src={block.dataUrl || block.url} alt="Preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6 }} />
      </div>
    )}
    <Field label="Alt Text"><input style={inputStyle} value={block.alt} onChange={e => upd({ alt: e.target.value })} /></Field>
    <Field label="Caption"><input style={inputStyle} value={block.caption} onChange={e => upd({ caption: e.target.value })} /></Field>
    <details style={{ marginTop: 6 }}>
      <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Links / URLs
      </summary>
      <div style={{ marginTop: 10 }}>
        <Field label="Link URL"><input style={inputStyle} value={block.linkUrl} onChange={e => upd({ linkUrl: e.target.value })} placeholder="https://…" /></Field>
      </div>
    </details>
    <Field label="Width">
      <select style={inputStyle} value={block.width} onChange={e => upd({ width: e.target.value })}>
        <option value="full">Full width</option><option value="wide">Wide (80%)</option>
        <option value="medium">Medium (60%)</option><option value="small">Small (40%)</option>
      </select>
    </Field>
    <Field label="Alignment">
      <select style={inputStyle} value={block.alignment} onChange={e => upd({ alignment: e.target.value })}>
        <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
      </select>
    </Field>
    <Field label="Border Radius">
      <input type="range" min={0} max={32} value={block.borderRadius}
        onChange={e => upd({ borderRadius: Number(e.target.value) })}
        style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>{block.borderRadius}px</span>
    </Field>
  </>);
}

function TextSettings({ block, upd }: any) {
  return (<>
    <Field label="Content (HTML)" hint="Supports <strong>, <em>, <a>, <ul>, <ol>, <h3>, etc.">
      <textarea style={{ ...textareaStyle, minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: 12 }} value={block.html} onChange={e => upd({ html: e.target.value })} />
    </Field>
    <Field label="Alignment">
      <select style={inputStyle} value={block.alignment} onChange={e => upd({ alignment: e.target.value })}>
        <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
      </select>
    </Field>
    <Field label="Max Width">
      <select style={inputStyle} value={block.maxWidth} onChange={e => upd({ maxWidth: e.target.value })}>
        <option value="full">Full</option><option value="reading">Reading (720px)</option><option value="narrow">Narrow (560px)</option>
      </select>
    </Field>
  </>);
}

function HtmlSettings({ block, upd }: any) {
  return (<>
    <Field label="Label"><input style={inputStyle} value={block.label} onChange={e => upd({ label: e.target.value })} /></Field>
    <Field label="HTML Source" hint="Inline styles are safe. Scripts are not supported.">
      <textarea style={{ ...textareaStyle, minHeight: 240, fontFamily: 'var(--font-mono)', fontSize: 12 }} value={block.html} onChange={e => upd({ html: e.target.value })} />
    </Field>
  </>);
}

function PromptSettings({ block, upd }: any) {
  return (<>
    <Field label="Heading"><input style={inputStyle} value={block.heading} onChange={e => upd({ heading: e.target.value })} /></Field>
    <Field label="Step Label"><input style={inputStyle} value={block.step} onChange={e => upd({ step: e.target.value })} /></Field>
    <Field label="Framework"><input style={inputStyle} value={block.framework} onChange={e => upd({ framework: e.target.value })} /></Field>
    <Field label="Bad Prompt"><textarea style={{ ...textareaStyle, minHeight: 60 }} value={block.badPrompt} onChange={e => upd({ badPrompt: e.target.value })} /></Field>
    <Field label="Good Prompt"><textarea style={{ ...textareaStyle, minHeight: 120 }} value={block.goodPrompt} onChange={e => upd({ goodPrompt: e.target.value })} /></Field>
    <Field label="Explanation"><textarea style={textareaStyle} value={block.explanation} onChange={e => upd({ explanation: e.target.value })} /></Field>
  </>);
}

function SbarSettings({ block, upd }: any) {
  return (<>
    <Field label="Heading"><input style={inputStyle} value={block.heading} onChange={e => upd({ heading: e.target.value })} /></Field>
    {(block.steps || []).map((step: any, i: number) => (
      <div key={step.letter} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>{step.letter} — {step.name}</div>
        <Field label="Description">
          <textarea style={{ ...textareaStyle, minHeight: 60 }} value={step.description} onChange={e => {
            const steps = [...block.steps]; steps[i] = { ...step, description: e.target.value }; upd({ steps });
          }} />
        </Field>
        <Field label="Example">
          <textarea style={{ ...textareaStyle, minHeight: 60 }} value={step.example} onChange={e => {
            const steps = [...block.steps]; steps[i] = { ...step, example: e.target.value }; upd({ steps });
          }} />
        </Field>
      </div>
    ))}
    <Field label="Template Prompt"><textarea style={{ ...textareaStyle, minHeight: 160, fontFamily: 'var(--font-mono)', fontSize: 12 }} value={block.templatePrompt} onChange={e => upd({ templatePrompt: e.target.value })} /></Field>
  </>);
}

function TermSettings({ block, upd }: any) {
  return (<>
    <Field label="Term"><input style={inputStyle} value={block.term} onChange={e => upd({ term: e.target.value })} /></Field>
    <Field label="Definition"><textarea style={textareaStyle} value={block.definition} onChange={e => upd({ definition: e.target.value })} /></Field>
    <Field label="Relevance to Medicine"><textarea style={textareaStyle} value={block.relevance} onChange={e => upd({ relevance: e.target.value })} /></Field>
    <Field label="Neurology Application"><textarea style={textareaStyle} value={block.neurologyApplication} onChange={e => upd({ neurologyApplication: e.target.value })} /></Field>
    <Field label="Related Terms" hint="Comma-separated">
      <input style={inputStyle} value={(block.relatedTerms || []).join(', ')} onChange={e => upd({ relatedTerms: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
    </Field>
  </>);
}

function CaseSettings({ block, upd }: any) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  return (<>
    <Field label="Year"><input style={inputStyle} value={block.year} onChange={e => upd({ year: e.target.value })} /></Field>
    <Field label="Title"><input style={inputStyle} value={block.title} onChange={e => upd({ title: e.target.value })} /></Field>
    <Field label="Content"><textarea style={{ ...textareaStyle, minHeight: 120 }} value={block.content} onChange={e => upd({ content: e.target.value })} /></Field>
    <Field label="Significance"><textarea style={textareaStyle} value={block.significance} onChange={e => upd({ significance: e.target.value })} /></Field>
    <Field label="Source URL"><input style={inputStyle} value={block.sourceUrl || ''} onChange={e => upd({ sourceUrl: e.target.value })} placeholder="https://doi.org/…" /></Field>
    <Field label="Source Label"><input style={inputStyle} value={block.sourceLabel || ''} onChange={e => upd({ sourceLabel: e.target.value })} placeholder="e.g., Turing, 1950 — Mind Journal" /></Field>
    <Field label="Image (optional)">
      <button onClick={() => fileRef.current?.click()}
        style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', color: 'var(--color-muted)' }}>
        {block.imageDataUrl ? '✓ Image uploaded — click to replace' : 'Upload historical image (optional)'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
        const f = e.target.files?.[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => upd({ imageDataUrl: ev.target?.result as string });
        reader.readAsDataURL(f);
      }} />
      {(block.imageDataUrl || block.imageUrl) && (
        <div style={{ marginTop: 8 }}>
          <img src={block.imageDataUrl || block.imageUrl} alt="" style={{ maxHeight: 80, borderRadius: 6 }} />
          <button onClick={() => upd({ imageDataUrl: '', imageUrl: '' })}
            style={{ display: 'block', marginTop: 4, background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontSize: 11 }}>
            Remove image
          </button>
        </div>
      )}
    </Field>
    <Field label="Image URL (alternative)"><input style={inputStyle} value={block.imageUrl || ''} onChange={e => upd({ imageUrl: e.target.value })} placeholder="https://…" /></Field>
  </>);
}

function QuickHitsSettings({ block, upd, onAddHit, onUpdateHit, onDeleteHit }: any) {
  return (<>
    <Field label="Heading"><input style={inputStyle} value={block.heading} onChange={e => upd({ heading: e.target.value })} /></Field>
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{block.hits?.length || 0} Hits</span>
        <button onClick={onAddHit} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--color-accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
          <Plus size={11} /> Add Hit
        </button>
      </div>
      {(block.hits || []).map((hit: QuickHit) => (
        <div key={hit.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={() => onDeleteHit(hit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B' }}><Trash2 size={13} /></button>
          </div>
          <Field label="Title"><input style={inputStyle} value={hit.title} onChange={e => onUpdateHit(hit.id, { title: e.target.value })} /></Field>
          <Field label="URL"><input style={inputStyle} value={hit.url} onChange={e => onUpdateHit(hit.id, { url: e.target.value })} placeholder="https://…" /></Field>
          <Field label="Source"><input style={inputStyle} value={hit.source} onChange={e => onUpdateHit(hit.id, { source: e.target.value })} /></Field>
          <Field label="Summary"><textarea style={{ ...textareaStyle, minHeight: 60 }} value={hit.summary} onChange={e => onUpdateHit(hit.id, { summary: e.target.value })} /></Field>
        </div>
      ))}
    </div>
  </>);
}

// ─── Spacer Settings ─────────────────────────────────────────────────────────
function SpacerSettings({ block, upd }: any) {
  return (<>
    <Field label={`Height: ${block.height}px`}>
      <input type="range" min={8} max={200} value={block.height} onChange={e => upd({ height: Number(e.target.value) })} style={{ width: '100%' }} />
    </Field>
    <Field label="Show Divider Line">
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!block.showLine} onChange={e => upd({ showLine: e.target.checked })} style={{ accentColor: 'var(--color-accent)' }} />
        Show divider line
      </label>
    </Field>
    {block.showLine && (
      <Field label="Line Style">
        <select style={inputStyle} value={block.lineStyle} onChange={e => upd({ lineStyle: e.target.value })}>
          <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
        </select>
      </Field>
    )}
  </>);
}

// ─── Footer Settings ─────────────────────────────────────────────────────────
function FooterSettings({ block, upd }: any) {
  return (<>
    <Field label="Institution"><input style={inputStyle} value={block.institution} onChange={e => upd({ institution: e.target.value })} /></Field>
    <Field label="Department"><input style={inputStyle} value={block.department} onChange={e => upd({ department: e.target.value })} /></Field>
    <Field label="Editors"><input style={inputStyle} value={block.editors} onChange={e => upd({ editors: e.target.value })} /></Field>
    <Field label="Contact Email"><input style={inputStyle} type="email" value={block.contactEmail} onChange={e => upd({ contactEmail: e.target.value })} /></Field>
    <Field label="Website URL"><input style={inputStyle} value={block.websiteUrl} onChange={e => upd({ websiteUrl: e.target.value })} placeholder="https://…" /></Field>
    <Field label="Subscribe URL"><input style={inputStyle} value={block.subscribeUrl} onChange={e => upd({ subscribeUrl: e.target.value })} placeholder="https://…" /></Field>
    <Field label="Unsubscribe URL"><input style={inputStyle} value={block.unsubscribeUrl} onChange={e => upd({ unsubscribeUrl: e.target.value })} placeholder="https://…" /></Field>
    <Field label="Copyright Year"><input style={inputStyle} value={block.copyrightYear} onChange={e => upd({ copyrightYear: e.target.value })} /></Field>
    <Field label="Disclaimer"><textarea style={textareaStyle} value={block.disclaimer} onChange={e => upd({ disclaimer: e.target.value })} /></Field>
    <Field label="Next Issue Date"><input style={inputStyle} value={block.nextIssueDate} onChange={e => upd({ nextIssueDate: e.target.value })} /></Field>
    <Field label="Next Issue Teaser"><input style={inputStyle} value={block.nextIssueTeaser} onChange={e => upd({ nextIssueTeaser: e.target.value })} /></Field>
  </>);
}

// ─── Humor Settings (extended with image + source URL) ────────────────────────
function HumorSettingsExtended({ block, upd }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (<>
    <Field label="Heading"><input style={inputStyle} value={block.heading} onChange={e => upd({ heading: e.target.value })} /></Field>
    <Field label="Emoji Decoration"><input style={inputStyle} value={block.emojiDecor} onChange={e => upd({ emojiDecor: e.target.value })} placeholder="😄 🧠 🤖" /></Field>
    <Field label="Content"><textarea style={{ ...textareaStyle, minHeight: 120 }} value={block.content} onChange={e => upd({ content: e.target.value })} /></Field>
    <Field label="Attribution"><input style={inputStyle} value={block.attribution} onChange={e => upd({ attribution: e.target.value })} /></Field>
    <Field label="Source URL (optional)"><input style={inputStyle} value={block.sourceUrl || ''} onChange={e => upd({ sourceUrl: e.target.value })} placeholder="https://…" /></Field>
    <Field label="Image URL (optional)"><input style={inputStyle} value={block.imageUrl || ''} onChange={e => upd({ imageUrl: e.target.value })} placeholder="https://…" /></Field>
    <Field label="Upload Image">
      <button onClick={() => fileRef.current?.click()} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', color: 'var(--color-muted)' }}>
        {block.imageDataUrl ? '✓ Uploaded — click to replace' : 'Click to upload image'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
        const f = e.target.files?.[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => upd({ imageDataUrl: ev.target?.result as string });
        reader.readAsDataURL(f);
      }} />
      {(block.imageDataUrl || block.imageUrl) && <div style={{ marginTop: 8 }}><img src={block.imageDataUrl || block.imageUrl} alt="Preview" style={{ maxHeight: 100, maxWidth: '100%', borderRadius: 8 }} /></div>}
    </Field>
  </>);
}

// ─── AI Case File Settings (with image + source URL) ─────────────────────────
function AiCaseFileSettingsExtended({ block, upd }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (<>
    <Field label="Year"><input style={inputStyle} value={block.year} onChange={e => upd({ year: e.target.value })} /></Field>
    <Field label="Title"><input style={inputStyle} value={block.title} onChange={e => upd({ title: e.target.value })} /></Field>
    <Field label="Content"><textarea style={{ ...textareaStyle, minHeight: 140 }} value={block.content} onChange={e => upd({ content: e.target.value })} /></Field>
    <Field label="Significance"><textarea style={textareaStyle} value={block.significance} onChange={e => upd({ significance: e.target.value })} /></Field>
    <Field label="Source URL"><input style={inputStyle} value={block.sourceUrl || ''} onChange={e => upd({ sourceUrl: e.target.value })} placeholder="https://doi.org/…" /></Field>
    <Field label="Source Label"><input style={inputStyle} value={block.sourceLabel || ''} onChange={e => upd({ sourceLabel: e.target.value })} placeholder="Author, Year — Journal" /></Field>
    <Field label="Image URL (optional)"><input style={inputStyle} value={block.imageUrl || ''} onChange={e => upd({ imageUrl: e.target.value })} placeholder="https://…" /></Field>
    <Field label="Upload Image">
      <button onClick={() => fileRef.current?.click()} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', color: 'var(--color-muted)' }}>
        {block.imageDataUrl ? '✓ Uploaded — click to replace' : 'Click to upload image'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
        const f = e.target.files?.[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => upd({ imageDataUrl: ev.target?.result as string });
        reader.readAsDataURL(f);
      }} />
      {(block.imageDataUrl || block.imageUrl) && <div style={{ marginTop: 8 }}><img src={block.imageDataUrl || block.imageUrl} alt="Preview" style={{ maxHeight: 100, maxWidth: '100%', borderRadius: 8 }} /></div>}
    </Field>
  </>);
}

// ─── Ticker Settings Extended (with clickable linked items) ───────────────────
function TickerSettingsExtended({ block, upd }: any) {
  const links: {text: string; url: string}[] = block.links || [];
  const items: string[] = block.items || [];
  const [rssText, setRssText] = useState((block.rssUrls || []).join('\n'));
  return (<>
    <Field label="Source">
      <select style={inputStyle} value={block.sourceMode || 'manual'} onChange={e => upd({ sourceMode: e.target.value })}>
        <option value="manual">Manual</option>
        <option value="rss">RSS feeds</option>
      </select>
    </Field>

    {block.sourceMode === 'rss' && (
      <details style={{ marginTop: 6 }}>
        <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          RSS settings
        </summary>
        <div style={{ marginTop: 10 }}>
          <Field label="RSS URLs (one per line)">
            <textarea
              style={{ ...textareaStyle, minHeight: 110 }}
              value={rssText}
              onChange={e => setRssText(e.target.value)}
              onBlur={() => {
                const urls = rssText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                upd({ rssUrls: urls });
              }}
              placeholder="https://…/rss.xml\nhttps://…/feed"
            />
          </Field>
          <Field label="Max RSS items">
            <input style={inputStyle} type="number" min={5} max={100} value={block.rssMaxItems ?? 20} onChange={e => upd({ rssMaxItems: Number(e.target.value) || 20 })} />
          </Field>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-muted)' }}>
            The ticker will aggregate titles across feeds and render them as clickable links.
          </div>
        </div>
      </details>
    )}

    <Field label="Speed">
      <select style={inputStyle} value={block.speed} onChange={e => upd({ speed: e.target.value })}>
        <option value="slow">Slow</option><option value="medium">Medium</option><option value="fast">Fast</option>
      </select>
    </Field>
    <Field label="Background Color"><input type="color" value={block.backgroundColor || '#003087'} onChange={e => upd({ backgroundColor: e.target.value })} /></Field>
    <Field label="Text Color"><input type="color" value={block.textColor || '#ffffff'} onChange={e => upd({ textColor: e.target.value })} /></Field>
    {block.sourceMode !== 'rss' && (
    <>
    <Field label="Mode">
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
        <input type="checkbox" checked={!!block.useLinks} onChange={e => upd({ useLinks: e.target.checked })} style={{ accentColor: 'var(--color-accent)' }} />
        Use clickable linked headlines
      </label>
    </Field>
    {!block.useLinks ? (
      <Field label={`Plain Text Items (${items.length})`} hint="One headline per line">
        <textarea style={{ ...textareaStyle, minHeight: 120 }} value={items.join('\n')} onChange={e => upd({ items: e.target.value.split('\n').filter((s: string) => s.trim()) })} />
      </Field>
    ) : (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{links.length} Linked Items</span>
          <button onClick={() => upd({ links: [...links, { text: 'New headline', url: '' }] })}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--color-accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            <Plus size={10} /> Add
          </button>
        </div>
        {links.map((link, i) => (
          <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <Field label="Headline">
              <input style={inputStyle} value={link.text} onChange={e => { const nl = [...links]; nl[i] = {...link, text: e.target.value}; upd({ links: nl }); }} />
            </Field>
            <details>
              <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>URL</summary>
              <div style={{ marginTop: 10 }}>
                <Field label="URL">
                  <input style={inputStyle} value={link.url} onChange={e => { const nl = [...links]; nl[i] = {...link, url: e.target.value}; upd({ links: nl }); }} placeholder="https://…" />
                </Field>
              </div>
            </details>
            <button onClick={() => upd({ links: links.filter((_: any, j: number) => j !== i) })}
              style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={11} /> Remove
            </button>
          </div>
        ))}
      </div>
    )}
    </>
    )}
  </>);
}

// ─── AI Safety Settings ───────────────────────────────────────────────────────
function AiSafetySettingsPanel({ block, upd }: any) {
  const updates = block.updates || [];
  const categories = ['FDA', 'Policy', 'Incident', 'Guideline', 'Alert', 'Research'];
  const severities = ['critical', 'high', 'medium', 'informational'];

  const addUpdate = () => upd({
    updates: [...updates, {
      id: String(Date.now()), date: new Date().toISOString().split('T')[0],
      category: 'Alert', title: 'New Safety Update', summary: '', url: '', severity: 'medium'
    }]
  });

  return (<>
    <Field label="Heading"><input style={inputStyle} value={block.heading} onChange={e => upd({ heading: e.target.value })} /></Field>
    <Field label="Subheading"><input style={inputStyle} value={block.subheading} onChange={e => upd({ subheading: e.target.value })} /></Field>
    <Field label="Show Last Updated Date">
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!block.showLastUpdated} onChange={e => upd({ showLastUpdated: e.target.checked })} style={{ accentColor: 'var(--color-accent)' }} />
        Show last updated date
      </label>
    </Field>
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {updates.length} Safety Updates
        </span>
        <button onClick={addUpdate} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#C0392B', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
          <Plus size={11} /> Add Update
        </button>
      </div>
      {updates.map((u: any, i: number) => (
        <div key={u.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 12, background: 'var(--color-background)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Update {i + 1}</span>
            <button onClick={() => upd({ updates: updates.filter((_: any, j: number) => j !== i) })}
              style={{ background: '#FEF0EE', border: '1px solid #f5c6c0', borderRadius: 5, color: '#7A1E12', cursor: 'pointer', padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={11} /> Delete
            </button>
          </div>
          <Field label="Date"><input style={inputStyle} type="date" value={u.date} onChange={e => { const arr = [...updates]; arr[i] = {...u, date: e.target.value}; upd({ updates: arr }); }} /></Field>
          <Field label="Category">
            <select style={inputStyle} value={u.category} onChange={e => { const arr = [...updates]; arr[i] = {...u, category: e.target.value}; upd({ updates: arr }); }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Severity">
            <select style={inputStyle} value={u.severity} onChange={e => { const arr = [...updates]; arr[i] = {...u, severity: e.target.value}; upd({ updates: arr }); }}>
              {severities.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Title"><input style={inputStyle} value={u.title} onChange={e => { const arr = [...updates]; arr[i] = {...u, title: e.target.value}; upd({ updates: arr }); }} /></Field>
          <Field label="Summary"><textarea style={{ ...textareaStyle, minHeight: 80 }} value={u.summary} onChange={e => { const arr = [...updates]; arr[i] = {...u, summary: e.target.value}; upd({ updates: arr }); }} /></Field>
          <Field label="URL (optional)"><input style={inputStyle} value={u.url} onChange={e => { const arr = [...updates]; arr[i] = {...u, url: e.target.value}; upd({ updates: arr }); }} placeholder="https://…" /></Field>
        </div>
      ))}
    </div>
  </>);
}

// ─── Northwell Spotlight Settings ─────────────────────────────────────────────
function NorthwellSpotlightSettings({ block, upd }: any) {
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const items = block.items || [];

  return (<>
    <Field label="Heading"><input style={inputStyle} value={block.heading} onChange={e => upd({ heading: e.target.value })} /></Field>
    <Field label="Subheading"><input style={inputStyle} value={block.subheading} onChange={e => upd({ subheading: e.target.value })} /></Field>
    <Field label="Max Items (1–6)"><input style={inputStyle} type="number" min={1} max={6} value={block.maxItems || 6} onChange={e => upd({ maxItems: Number(e.target.value) })} /></Field>
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{items.length} Items</span>
        <button onClick={() => upd({ items: [...items, { id: String(Date.now()), title: 'New Northwell Item', url: '', pubDate: new Date().toISOString(), summary: '', imageUrl: '', category: 'AI Innovation' }] })}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--color-accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
          <Plus size={11} /> Add Item
        </button>
      </div>
      {items.map((item: any, i: number) => (
        <div key={item.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Item {i + 1}</span>
            <button onClick={() => upd({ items: items.filter((_: any, j: number) => j !== i) })}
              style={{ background: '#FEF0EE', border: '1px solid #f5c6c0', borderRadius: 5, color: '#7A1E12', cursor: 'pointer', padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={11} /> Delete
            </button>
          </div>
          <Field label="Category"><input style={inputStyle} value={item.category} onChange={e => { const it = [...items]; it[i] = {...item, category: e.target.value}; upd({ items: it }); }} /></Field>
          <Field label="Title"><input style={inputStyle} value={item.title} onChange={e => { const it = [...items]; it[i] = {...item, title: e.target.value}; upd({ items: it }); }} /></Field>
          <Field label="URL"><input style={inputStyle} value={item.url} onChange={e => { const it = [...items]; it[i] = {...item, url: e.target.value}; upd({ items: it }); }} placeholder="https://northwell.edu/…" /></Field>
          <Field label="Summary"><textarea style={{ ...textareaStyle, minHeight: 60 }} value={item.summary} onChange={e => { const it = [...items]; it[i] = {...item, summary: e.target.value}; upd({ items: it }); }} /></Field>
          <Field label="Image URL"><input style={inputStyle} value={item.imageUrl} onChange={e => { const it = [...items]; it[i] = {...item, imageUrl: e.target.value}; upd({ items: it }); }} placeholder="https://…" /></Field>
          <Field label="Upload Image">
            <button onClick={() => fileRefs.current[i]?.click()} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', color: 'var(--color-muted)' }}>Upload image</button>
            <input type="file" accept="image/*" style={{ display: 'none' }} ref={el => { fileRefs.current[i] = el; }} onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              const reader = new FileReader();
              reader.onload = ev => { const it = [...items]; it[i] = {...item, imageUrl: ev.target?.result as string}; upd({ items: it }); };
              reader.readAsDataURL(f);
            }} />
          </Field>
          <Field label="Pub Date"><input style={inputStyle} type="date" value={item.pubDate?.split('T')[0] || ''} onChange={e => { const it = [...items]; it[i] = {...item, pubDate: e.target.value}; upd({ items: it }); }} /></Field>
        </div>
      ))}
    </div>
  </>);
}

// ─── RSS Sidebar Settings ─────────────────────────────────────────────────────
function RssSidebarSettings({ block, upd }: any) {
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState('');
  const PROXY = 'https://api.allorigins.win/raw?url=';

  const handleFetch = async () => {
    setFetching(true); setError('');
    const allItems: any[] = [];
    for (const url of (block.feedUrls || [])) {
      try {
        const res = await fetch(PROXY + encodeURIComponent(url));
        const xml = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const channelTitle = doc.querySelector('channel > title')?.textContent?.trim() || url;
        for (const el of Array.from(doc.querySelectorAll('item')).slice(0, 10)) {
          allItems.push({
            title: el.querySelector('title')?.textContent?.trim() || '',
            url: el.querySelector('link')?.textContent?.trim() || '',
            source: channelTitle,
            pubDate: el.querySelector('pubDate')?.textContent?.trim() || '',
          });
        }
      } catch (e) { setError(`Failed to fetch: ${url}`); }
    }
    const seen = new Set<string>();
    const deduped = allItems.filter(it => { if (!it.url || seen.has(it.url)) return false; seen.add(it.url); return true; });
    deduped.sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0));
    upd({ items: deduped.slice(0, block.maxItems || 15), lastFetched: new Date().toISOString() });
    setFetching(false);
  };

  return (<>
    <Field label="Heading"><input style={inputStyle} value={block.heading} onChange={e => upd({ heading: e.target.value })} /></Field>
    <Field label="Max Items (3–20)"><input style={inputStyle} type="number" min={3} max={20} value={block.maxItems || 8} onChange={e => upd({ maxItems: Number(e.target.value) })} /></Field>
    <Field label={`RSS Feed URLs (${(block.feedUrls || []).length})`} hint="One URL per line">
      <textarea style={{ ...textareaStyle, minHeight: 120, fontFamily: 'var(--font-mono)', fontSize: 11 }}
        value={(block.feedUrls || []).join('\n')}
        onChange={e => upd({ feedUrls: e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean) })} />
    </Field>
    <button onClick={handleFetch} disabled={fetching}
      style={{ width: '100%', padding: '9px 0', background: fetching ? 'var(--color-muted)' : 'var(--color-accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: 'var(--font-body)', cursor: fetching ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
      {fetching ? '⏳ Fetching…' : `🔄 Refresh Feed (${(block.items || []).length} items loaded)`}
    </button>
    {error && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#C0392B', marginBottom: 8 }}>{error}</div>}
    {block.lastFetched && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textAlign: 'center' }}>Last fetched: {new Date(block.lastFetched).toLocaleString()}</div>}
  </>);
}

// ─── Clinical Prompt Templates Settings ───────────────────────────────────────
function ClinicalPromptTemplateSettings({ block, upd }: any) {
  const templates = block.templates || [];
  return (<>
    <Field label="Heading"><input style={inputStyle} value={block.heading} onChange={e => upd({ heading: e.target.value })} /></Field>
    <Field label="Description"><textarea style={{ ...textareaStyle, minHeight: 60 }} value={block.description} onChange={e => upd({ description: e.target.value })} /></Field>
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{templates.length} Templates</span>
        <button onClick={() => upd({ templates: [...templates, { id: String(Date.now()), category: 'General', title: 'New Template', prompt: 'Act as a [ROLE]. [TASK]. [CONSTRAINTS].', useCase: 'Use case' }] })}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--color-accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
          <Plus size={11} /> Add Template
        </button>
      </div>
      {templates.map((tpl: any, i: number) => (
        <div key={tpl.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 12, background: 'var(--color-background)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Template {i + 1}</span>
            <button onClick={() => upd({ templates: templates.filter((_: any, j: number) => j !== i) })}
              style={{ background: '#FEF0EE', border: '1px solid #f5c6c0', borderRadius: 5, color: '#7A1E12', cursor: 'pointer', padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={11} /> Delete
            </button>
          </div>
          <Field label="Category"><input style={inputStyle} value={tpl.category} onChange={e => { const t = [...templates]; t[i] = {...tpl, category: e.target.value}; upd({ templates: t }); }} /></Field>
          <Field label="Title"><input style={inputStyle} value={tpl.title} onChange={e => { const t = [...templates]; t[i] = {...tpl, title: e.target.value}; upd({ templates: t }); }} /></Field>
          <Field label="Use Case"><input style={inputStyle} value={tpl.useCase} onChange={e => { const t = [...templates]; t[i] = {...tpl, useCase: e.target.value}; upd({ templates: t }); }} /></Field>
          <Field label="Prompt" hint="Use [BRACKETS] for fill-in variables">
            <textarea style={{ ...textareaStyle, minHeight: 180, fontFamily: 'var(--font-mono)', fontSize: 11 }}
              value={tpl.prompt} onChange={e => { const t = [...templates]; t[i] = {...tpl, prompt: e.target.value}; upd({ templates: t }); }} />
          </Field>
        </div>
      ))}
    </div>
  </>);
}
