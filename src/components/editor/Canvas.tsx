import React, { useCallback } from 'react';
import {
  DndContext, DragEndEvent, PointerSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy, Settings, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import type { Newsletter, Block, BlockType, Article, EditorState } from '../../types';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { BLOCK_LABELS } from '../../data/defaults';

interface Props {
  newsletter: Newsletter;
  editorState: EditorState;
  onSelectBlock: (id: string | null) => void;
  onMoveBlock: (from: number, to: number) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onAddBlock: (type: BlockType, afterId?: string) => void;
  onUpdateBlock: (id: string, changes: Partial<Block>) => void;
  onUpdateArticle: (blockId: string, articleId: string, changes: Partial<Article>) => void;
  onDeleteArticle: (blockId: string, articleId: string) => void;
  onMoveArticle: (blockId: string, from: number, to: number) => void;
  onAddArticle: (blockId: string) => void;
}

export function Canvas({ newsletter, editorState, onSelectBlock, onMoveBlock, onDeleteBlock, onDuplicateBlock, onAddBlock, onUpdateBlock, onUpdateArticle, onDeleteArticle, onMoveArticle, onAddArticle }: Props) {
  const { blockOrder, blocks, theme } = newsletter;
  const { selectedBlockId, previewMode, zoom } = editorState;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = blockOrder.indexOf(String(active.id));
    const to = blockOrder.indexOf(String(over.id));
    if (from !== -1 && to !== -1) onMoveBlock(from, to);
  }, [blockOrder, onMoveBlock]);

  const canvasWidth = 800;
  const scale = zoom / 100;

  return (
    <div style={{
      flex: 1, overflow: 'auto',
      background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: previewMode ? '32px 0' : '24px 0 80px',
    }}>
      <div style={{
        width: canvasWidth * scale,
        transformOrigin: 'top center',
        transform: `scale(${scale})`,
        // When zoomed out, reserve exact vertical space so scroll is correct
        marginBottom: scale < 1 ? `calc((${scale} - 1) * 100%)` : 0,
      }}>
        {/* Paper */}
        <div id="nap-paper" style={{
          width: canvasWidth,
          background: theme.surface,
          boxShadow: previewMode ? 'none' : '0 0 0 1px rgba(0,0,0,0.05), 0 8px 40px rgba(0,0,0,0.12)',
          borderRadius: previewMode ? 0 : 12,
          overflow: 'hidden',
          minHeight: 400,
        }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blockOrder} strategy={verticalListSortingStrategy}>
              {blockOrder.map((id, idx) => {
                const block = blocks[id];
                if (!block) return null;
                return (
                  <SortableBlock
                    key={id}
                    id={id}
                    block={block}
                    idx={idx}
                    total={blockOrder.length}
                    selected={selectedBlockId === id}
                    previewMode={previewMode}
                    theme={newsletter.theme}
                    newsletter={newsletter}
                    onSelect={() => onSelectBlock(selectedBlockId === id ? null : id)}
                    onDelete={() => onDeleteBlock(id)}
                    onDuplicate={() => onDuplicateBlock(id)}
                    onMoveUp={() => onMoveBlock(idx, idx - 1)}
                    onMoveDown={() => onMoveBlock(idx, idx + 1)}
                    onAddAfter={(type) => onAddBlock(type, id)}
                    onUpdateBlock={(changes) => onUpdateBlock(id, changes)}
                    onUpdateArticle={onUpdateArticle}
                    onDeleteArticle={onDeleteArticle}
                    onMoveArticle={onMoveArticle}
                    onAddArticle={onAddArticle}
                  />
                );
              })}
            </SortableContext>
          </DndContext>

          {blockOrder.length === 0 && (
            <div style={{ padding: 80, textAlign: 'center', color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
              <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Empty newsletter</div>
              <div style={{ fontSize: 14 }}>Use the Blocks panel to add your first block.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Block Wrapper ───────────────────────────────────────────────────

interface SortableBlockProps {
  id: string;
  block: Block;
  idx: number;
  total: number;
  selected: boolean;
  previewMode: boolean;
  theme: Newsletter['theme'];
  newsletter: Newsletter;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddAfter: (type: BlockType) => void;
  onUpdateBlock: (changes: Partial<Block>) => void;
  onUpdateArticle: (blockId: string, articleId: string, changes: Partial<Article>) => void;
  onDeleteArticle: (blockId: string, articleId: string) => void;
  onMoveArticle: (blockId: string, from: number, to: number) => void;
  onAddArticle: (blockId: string) => void;
}

function SortableBlock({ id, block, idx, total, selected, previewMode, theme, newsletter, onSelect, onDelete, onDuplicate, onMoveUp, onMoveDown, onAddAfter, onUpdateBlock, onUpdateArticle, onDeleteArticle, onMoveArticle, onAddArticle }: SortableBlockProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  };

  if (previewMode) {
    return (
      <div ref={setNodeRef} style={style}>
        <BlockRenderer block={block} theme={theme} newsletter={newsletter}
          // In preview mode we intentionally disable inline editing.
          editable={false}
          onUpdateBlock={onUpdateBlock} onUpdateArticle={onUpdateArticle}
          onDeleteArticle={onDeleteArticle} onMoveArticle={onMoveArticle} onAddArticle={onAddArticle} />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Block container with selection ring */}
      <div
        onClick={onSelect}
        style={{
          position: 'relative',
          cursor: 'pointer',
          outline: selected ? '2px solid var(--color-accent)' : '2px solid transparent',
          outlineOffset: -2,
          transition: 'outline 0.1s',
        }}
      >
        {/* Block content */}
        <BlockRenderer block={block} theme={theme} newsletter={newsletter}
          // Editable when the block is selected on the canvas.
          editable={selected}
          onUpdateBlock={onUpdateBlock} onUpdateArticle={onUpdateArticle}
          onDeleteArticle={onDeleteArticle} onMoveArticle={onMoveArticle} onAddArticle={onAddArticle} />

        {/* Controls overlay */}
        {selected && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 6, right: 6,
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--color-primary)',
              borderRadius: 8, padding: '4px 6px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              zIndex: 10,
            }}
          >
            <BlockTypeLabel block={block} />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />
            <ControlBtn icon={<ChevronUp size={12} />} onClick={onMoveUp} disabled={idx === 0} title="Move up" />
            <ControlBtn icon={<ChevronDown size={12} />} onClick={onMoveDown} disabled={idx === total - 1} title="Move down" />
            <ControlBtn icon={<Copy size={12} />} onClick={onDuplicate} title="Duplicate" />
            <ControlBtn icon={<Settings size={12} />} onClick={onSelect} title="Settings" highlight />
            <ControlBtn icon={<Trash2 size={12} />} onClick={() => {
              if (confirm('Delete this block?')) onDelete();
            }} title="Delete" danger />
          </div>
        )}

        {/* Drag handle */}
        {selected && (
          <div
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 6, left: 6,
              background: 'var(--color-primary)',
              borderRadius: 6, padding: '4px 6px',
              cursor: 'grab', color: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center',
              zIndex: 10,
            }}
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </div>
        )}
      </div>

      {/* Add block between */}
      {selected && (
        <AddBlockBetween onAdd={onAddAfter} />
      )}
    </div>
  );
}

function BlockTypeLabel({ block }: { block: Block }) {
  const label = BLOCK_LABELS[block.type] || block.type;
  const emoji = label.split('  ')[0];
  const name = label.split('  ').slice(1).join('').trim();
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {emoji} {name}
    </span>
  );
}

function ControlBtn({ icon, onClick, disabled, title, highlight, danger }: {
  icon: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string;
  highlight?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26,
        background: danger ? 'rgba(192,57,43,0.4)' : highlight ? 'rgba(0,156,222,0.5)' : 'rgba(255,255,255,0.12)',
        border: 'none', borderRadius: 6, color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(192,57,43,0.65)' : 'rgba(255,255,255,0.25)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(192,57,43,0.4)' : highlight ? 'rgba(0,156,222,0.5)' : 'rgba(255,255,255,0.12)'; }}
    >
      {icon}
    </button>
  );
}

function AddBlockBetween({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = React.useState(false);

  const QUICK_TYPES: { type: BlockType; label: string }[] = [
    { type: 'article-grid', label: '📰 Article Grid' },
    { type: 'spotlight', label: '🔦 Spotlight' },
    { type: 'text', label: '📝 Text' },
    { type: 'image', label: '🖼️ Image' },
    { type: 'section-divider', label: '➖ Divider' },
    { type: 'spacer', label: '↕️ Spacer' },
    { type: 'quick-hits', label: '⚡ Quick Hits' },
    { type: 'ai-safety', label: '🛡️ AI Safety' },
    { type: 'institutional-spotlight', label: '🏥 Institutional' },
    { type: 'rss-sidebar', label: '📡 RSS Feed' },
    { type: 'prompt-template', label: '🧩 Template Prompt' },
    { type: 'safety-reminders', label: '⚠️ Safety Reminders' },
    { type: 'clinical-prompt-templates', label: '📎 Prompts' },
    { type: 'html-embed', label: '💻 HTML' },
  ];

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, zIndex: 5 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'var(--color-accent)', opacity: 0.3 }} />
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 12px',
          background: 'var(--color-accent)', border: 'none',
          borderRadius: 999, color: '#fff',
          fontSize: 11, fontFamily: 'var(--font-body)',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Plus size={11} /> Add block here
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 4,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 100, padding: 8,
            display: 'flex', flexWrap: 'wrap', gap: 4,
            width: 340,
          }}
          onClick={e => e.stopPropagation()}
        >
          {QUICK_TYPES.map(({ type, label }) => (
            <button key={type}
              onClick={() => { onAdd(type); setOpen(false); }}
              style={{
                padding: '6px 10px', background: 'var(--color-bg)',
                border: '1px solid var(--color-border)', borderRadius: 6,
                fontFamily: 'var(--font-body)', fontSize: 12,
                color: 'var(--color-text)', cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}