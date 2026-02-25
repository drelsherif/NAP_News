import React, { useRef, useState, useEffect } from 'react';
import {
  Save, Upload, Eye, EyeOff, ZoomIn, ZoomOut,
  GitBranch, Menu, MoreHorizontal, X, ChevronDown,
  FileCode2, Mail, Printer, Box, Download, FileJson
} from 'lucide-react';
import type { Newsletter, EditorState } from '../../types';
import { downloadHtml } from '../../utils/export';
import { downloadEmailHtml } from '../../utils/exportEmail';
import { printAsPdf, type PdfPageSize } from '../../utils/exportPdf';
import { downloadViewerBundle, downloadViewerEmbedded } from '../../utils/exportViewer';
import { downloadJson } from '../../utils/exportJson';

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
  onImport: (file: File) => void;
  onTogglePreview: () => void;
  onZoomChange: (zoom: number) => void;
  onUpdateMeta: (changes: Partial<Newsletter['meta']>) => void;
}

// ─── Export menu items ──────────────────────────────────────────────────────
const EXPORT_ITEMS = [
  {
    id: 'viewer-embedded',
    icon: <Box size={14} />,
    label: 'Viewer + JSON (self-contained)',
    sub: 'Single .html with JSON embedded — double-click to open anywhere',
    highlight: true,
  },
  {
    id: 'viewer-bundle',
    icon: <Box size={14} />,
    label: 'Viewer + JSON (sidecar)',
    sub: 'viewer.html + newsletter_issue#.json — serve or host together',
  },
  { divider: true },
  {
    id: 'html',
    icon: <FileCode2 size={14} />,
    label: 'Export HTML',
    sub: 'Standalone page — exact match to builder preview',
  },
  {
    id: 'email',
    icon: <Mail size={14} />,
    label: 'Export Email HTML',
    sub: 'Table-based, Gmail / Outlook compatible',
  },
  { divider: true },
  {
    id: 'pdf-a4',
    icon: <Printer size={14} />,
    label: 'Print / PDF (A4)',
    sub: 'Opens browser print dialog — Save as PDF',
  },
  {
    id: 'pdf-letter',
    icon: <Printer size={14} />,
    label: 'Print / PDF (Letter)',
    sub: 'US Letter format — Opens print dialog',
  },
  { divider: true },
  {
    id: 'json',
    icon: <FileJson size={14} />,
    label: 'Export JSON',
    sub: 'newsletter_issue#.json — re-importable backup',
  },
];

export function TopBar({
  newsletter, editorState, lastSaved,
  isMobile, isTablet, drawerOpen, onToggleDrawer,
  onSave, onSaveVersion, onImport,
  onTogglePreview, onZoomChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const zooms = [75, 90, 100, 110, 125];
  const zi = zooms.indexOf(editorState.zoom);
  const isNarrow = isMobile || isTablet;

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  function handleExportItem(id: string) {
    setExportOpen(false);
    switch (id) {
      case 'html':             downloadHtml(newsletter); break;
      case 'email':            downloadEmailHtml(newsletter); break;
      case 'pdf':              printAsPdf(newsletter, 'A4'); break;
      case 'pdf-a4':           printAsPdf(newsletter, 'A4'); break;
      case 'pdf-letter':       printAsPdf(newsletter, 'Letter'); break;
      case 'viewer-bundle':    downloadViewerBundle(newsletter); break;
      case 'viewer-embedded':  downloadViewerEmbedded(newsletter); break;
      case 'json':             downloadJson(newsletter); break;
    }
  }

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
            {lastSaved}
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

        {/* ── Export dropdown ── */}
        <div ref={exportRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setExportOpen(o => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: isMobile ? '6px 8px' : '6px 12px',
              background: 'rgba(255,255,255,0.22)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 8, color: '#fff', fontSize: 12,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
            title="Export options"
          >
            <Download size={14} />
            {!isMobile && <span>Export</span>}
            {!isMobile && <ChevronDown size={11} style={{ opacity: 0.7, transform: exportOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
          </button>

          {exportOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 6,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
              zIndex: 600, padding: 6, minWidth: 280,
              animation: 'fadeInUp 0.15s ease',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-muted)', padding: '6px 12px 4px' }}>
                Export Options
              </div>
              {EXPORT_ITEMS.map((item, i) => {
                if ('divider' in item) {
                  return <div key={i} style={{ height: 1, background: 'var(--color-border)', margin: '4px 8px' }} />;
                }
                return (
                  <button key={item.id}
                    onClick={() => handleExportItem(item.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      width: '100%', padding: '9px 12px',
                      background: item.highlight ? 'var(--color-accent)0F' : 'none',
                      border: item.highlight ? '1px solid var(--color-accent)33' : '1px solid transparent',
                      borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13,
                      color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left',
                      marginBottom: 2,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = item.highlight ? 'var(--color-accent)0F' : 'none'; }}
                  >
                    <span style={{ color: item.highlight ? 'var(--color-accent)' : 'var(--color-muted)', marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: item.highlight ? 600 : 400, color: item.highlight ? 'var(--color-accent)' : 'var(--color-text)' }}>{item.label}</div>
                      {item.sub && <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{item.sub}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop: inline secondary actions */}
        {!isNarrow && (
          <>
            <TBarBtn icon={<Save size={14} />} label="Save" onClick={onSave} />
            <TBarBtn icon={<GitBranch size={14} />} label="Version" onClick={onSaveVersion} />
            <TBarBtn icon={<Upload size={14} />} label="Import" onClick={() => fileRef.current?.click()} />
          </>
        )}

        {/* Mobile/tablet: overflow ⋮ for secondary actions */}
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

function TBarBtn({ icon, label, onClick, title, active, disabled }: {
  icon?: React.ReactNode; label?: string; onClick: () => void; title?: string;
  active?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: label ? '6px 12px' : '6px 8px',
        background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8, color: '#fff', fontSize: 12,
        fontFamily: 'var(--font-body)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.22)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'; }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
