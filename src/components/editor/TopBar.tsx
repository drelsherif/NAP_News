import React, { useRef, useState } from 'react';
import { Save, Download, Upload, Eye, EyeOff, ZoomIn, ZoomOut, FileJson, GitBranch, Menu, MoreHorizontal, X } from 'lucide-react';
import type { Newsletter, EditorState } from '../../types';
import { downloadHtml } from '../../utils/export';

interface Props {
  newsletter: Newsletter;
  editorState: EditorState;
  lastSaved: string;
  isMobile: boolean;
  isTablet: boolean;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onSave: () => void;
  onSaveVersion: () => void;
  onExportJson: () => void;
  onImport: (file: File) => void;
  onTogglePreview: () => void;
  onZoomChange: (zoom: number) => void;
  onUpdateMeta: (changes: Partial<Newsletter['meta']>) => void;
}

export function TopBar({
  newsletter, editorState, lastSaved,
  isMobile, isTablet, drawerOpen, onToggleDrawer,
  onSave, onSaveVersion, onExportJson, onImport,
  onTogglePreview, onZoomChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const zooms = [75, 90, 100, 110, 125];
  const zi = zooms.indexOf(editorState.zoom);
  const isNarrow = isMobile || isTablet;

  return (
    <div style={{
      height: 56,
      background: 'var(--color-primary)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', gap: 8, flexShrink: 0,
      fontFamily: 'var(--font-body)',
      position: 'relative', zIndex: 400,
    }}>

      {/* Left — hamburger (mobile/tablet) + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        {isNarrow && (
          <TBarBtn
            icon={drawerOpen ? <X size={16} /> : <Menu size={16} />}
            onClick={onToggleDrawer}
            title="Toggle panels"
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{
            color: '#fff', fontFamily: 'var(--font-display)', fontSize: isMobile ? 13 : 15,
            fontWeight: 400, lineHeight: 1.1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: isMobile ? 140 : 220,
          }}>
            {newsletter.meta.title || 'Newsletter Builder'}
          </span>
          {!isMobile && (
            <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Issue {newsletter.meta.issueNumber} Builder
            </span>
          )}
        </div>
      </div>

      {/* Center — zoom (desktop + tablet only) */}
      {!isMobile && (
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
      )}

      {/* Right — actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {lastSaved && !isNarrow && (
          <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)', fontSize: 11, marginRight: 4 }}>
            Saved {lastSaved}
          </span>
        )}

        {/* Preview — always visible */}
        <TBarBtn
          icon={editorState.previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          label={isMobile ? undefined : (editorState.previewMode ? 'Edit' : 'Preview')}
          onClick={onTogglePreview}
          active={editorState.previewMode}
          title="Toggle preview"
        />

        {/* Export HTML — always visible */}
        <TBarBtn
          icon={<Download size={14} />}
          label={isMobile ? undefined : 'Export HTML'}
          onClick={() => downloadHtml(newsletter)}
          highlight
          title="Export HTML"
        />

        {/* Desktop: all actions inline */}
        {!isNarrow && (
          <>
            <TBarBtn icon={<Save size={14} />} label="Save" onClick={onSave} />
            <TBarBtn icon={<GitBranch size={14} />} label="Version" onClick={onSaveVersion} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
            <TBarBtn icon={<FileJson size={14} />} label="Export JSON" onClick={onExportJson} />
            <TBarBtn icon={<Upload size={14} />} label="Import" onClick={() => fileRef.current?.click()} />
          </>
        )}

        {/* Tablet/Mobile: overflow menu */}
        {isNarrow && (
          <div style={{ position: 'relative' }}>
            <TBarBtn
              icon={<MoreHorizontal size={16} />}
              onClick={() => setOverflowOpen(o => !o)}
              active={overflowOpen}
              title="More actions"
            />
            {overflowOpen && (
              <div
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  zIndex: 500, padding: 6, minWidth: 160,
                  animation: 'fadeInUp 0.15s ease',
                }}
                onClick={() => setOverflowOpen(false)}
              >
                {[
                  { icon: <Save size={14} />, label: 'Save', action: onSave },
                  { icon: <GitBranch size={14} />, label: 'Save Version', action: onSaveVersion },
                  { icon: <FileJson size={14} />, label: 'Export JSON', action: onExportJson },
                  { icon: <Upload size={14} />, label: 'Import JSON', action: () => fileRef.current?.click() },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 12px',
                    background: 'none', border: 'none', borderRadius: 7,
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                  >
                    <span style={{ color: 'var(--color-muted)' }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
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
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.22)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = highlight ? 'rgba(255,255,255,0.22)' : active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'; }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
