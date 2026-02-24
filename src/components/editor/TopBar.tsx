import React, { useRef } from 'react';
import { Save, Download, Upload, Eye, EyeOff, ZoomIn, ZoomOut, FileJson, GitBranch } from 'lucide-react';
import type { Newsletter, EditorState } from '../../types';
import { downloadHtml } from '../../utils/export';

interface Props {
  newsletter: Newsletter;
  editorState: EditorState;
  lastSaved: string;
  onSave: () => void;
  onSaveVersion: () => void;
  onExportJson: () => void;
  onImport: (file: File) => void;
  onTogglePreview: () => void;
  onZoomChange: (zoom: number) => void;
  onUpdateMeta: (changes: Partial<Newsletter['meta']>) => void;
}

export function TopBar({ newsletter, editorState, lastSaved, onSave, onSaveVersion, onExportJson, onImport, onTogglePreview, onZoomChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const zooms = [75, 90, 100, 110, 125];
  const zi = zooms.indexOf(editorState.zoom);

  return (
    <div style={{
      height: 56,
      background: 'var(--color-primary)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', gap: 12, flexShrink: 0,
      fontFamily: 'var(--font-body)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 400, lineHeight: 1.1 }}>
            {newsletter.meta.title || 'Newsletter Builder'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Issue {newsletter.meta.issueNumber} Builder
          </span>
        </div>
      </div>

      {/* Center — zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <TBarBtn icon={<ZoomOut size={14} />} title="Zoom out"
          onClick={() => onZoomChange(zooms[Math.max(0, zi - 1)])}
          disabled={zi <= 0} />
        <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', fontSize: 12, minWidth: 36, textAlign: 'center' }}>
          {editorState.zoom}%
        </span>
        <TBarBtn icon={<ZoomIn size={14} />} title="Zoom in"
          onClick={() => onZoomChange(zooms[Math.min(zooms.length - 1, zi + 1)])}
          disabled={zi >= zooms.length - 1} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {lastSaved && (
          <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)', fontSize: 11, marginRight: 6 }}>
            Saved {lastSaved}
          </span>
        )}

        <TBarBtn icon={<Eye size={14} />} label={editorState.previewMode ? 'Edit' : 'Preview'}
          onClick={onTogglePreview}
          active={editorState.previewMode} />

        <TBarBtn icon={<Save size={14} />} label="Save" onClick={onSave} highlight />

        <TBarBtn icon={<GitBranch size={14} />} label="Version" onClick={onSaveVersion} />

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

        <TBarBtn icon={<Download size={14} />} label="Export HTML"
          onClick={() => downloadHtml(newsletter)} />

        <TBarBtn icon={<FileJson size={14} />} label="Export JSON"
          onClick={onExportJson} />

        <TBarBtn icon={<Upload size={14} />} label="Import"
          onClick={() => fileRef.current?.click()} />

        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}

function TBarBtn({ icon, label, onClick, title, active, highlight, disabled }: {
  icon?: React.ReactNode; label?: string; onClick: () => void; title?: string;
  active?: boolean; highlight?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: label ? '6px 12px' : '6px 8px',
        background: highlight ? 'rgba(255,255,255,0.22)' : active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
        border: '1px solid',
        borderColor: highlight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
        borderRadius: 8, color: '#fff', fontSize: 12,
        fontFamily: 'var(--font-body)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.22)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = highlight ? 'rgba(255,255,255,0.22)' : active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'; }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
