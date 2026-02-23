import React, { useState, useEffect, useCallback } from 'react';
import { useNewsletter } from './hooks/useNewsletter';
import { useStorage, useAutosave } from './hooks/useStorage';
import { useRss } from './hooks/useRss';
import { applyTheme } from './data/themes';
import { TopBar } from './components/editor/TopBar';
import { Sidebar } from './components/editor/Sidebar';
import { Canvas } from './components/editor/Canvas';
import type { EditorState, SidebarPanel } from './types';
import type { Newsletter } from './types';

declare global {
  interface Window {
    __NAP_NEWSLETTER__?: Newsletter;
  }
}

function isPreviewRoute(): boolean {
  return (window.location.hash || '').startsWith('#/preview');
}

export default function App() {
  const {
    newsletter, load, addBlock, deleteBlock, updateBlock, moveBlock, duplicateBlock,
    updateTheme, updateMeta,
    addArticle, updateArticle, deleteArticle, moveArticle,
    addQuickHit, updateQuickHit, deleteQuickHit,
  } = useNewsletter();

  const { autosave, loadAutosave, saveVersion, deleteVersion, versions, exportJSON, importJSON } = useStorage();

  const rss = useRss();

  const [previewDoc, setPreviewDoc] = useState<Newsletter | null>(null);
  const [routePreview, setRoutePreview] = useState<boolean>(isPreviewRoute());

  const [editorState, setEditorState] = useState<EditorState>({
    selectedBlockId: null,
    activePanel: 'blocks',
    previewMode: false,
    zoom: 100,
  });
  const [lastSaved, setLastSaved] = useState<string>('');
  const [toast, setToast] = useState<string>('');

  // Apply theme on change
  useEffect(() => { applyTheme(newsletter.theme); }, [newsletter.theme]);

  // Hash-route listener (portable exports use hash routing)
  useEffect(() => {
    const onHash = () => setRoutePreview(isPreviewRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Preview mode: load newsletter from embedded JSON or ./newsletter.json
  useEffect(() => {
    if (!routePreview) return;

    // 1) Embedded data (single-file export)
    if (window.__NAP_NEWSLETTER__) {
      setPreviewDoc(window.__NAP_NEWSLETTER__);
      load(window.__NAP_NEWSLETTER__);
      return;
    }

    // 2) Hosted web-zip (newsletter.json beside index.html)
    fetch('./newsletter.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((json: Newsletter) => {
        setPreviewDoc(json);
        load(json);
      })
      .catch(() => setPreviewDoc(null));
  }, [routePreview, load]);

  // Load autosave on mount
  useEffect(() => {
    if (routePreview) return; // never load autosave in preview/production mode
    const saved = loadAutosave();
    if (saved) { load(saved); setLastSaved('Loaded autosave'); }
  }, []); // eslint-disable-line

  // Autosave every 30s
  useAutosave(newsletter, (nl) => {
    if (routePreview) return;
    autosave(nl);
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const handleSave = useCallback(() => {
    autosave(newsletter);
    setLastSaved(new Date().toLocaleTimeString());
    showToast('Saved ✓');
  }, [newsletter, autosave, showToast]);

  const handleSaveVersion = useCallback(() => {
    const label = prompt('Version name (optional):') || undefined;
    saveVersion(newsletter, label);
    showToast('Version saved');
  }, [newsletter, saveVersion, showToast]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const nl = await importJSON(file);
      load(nl);
      showToast('Imported ✓');
    } catch (e: any) {
      showToast(`Import failed: ${e.message}`);
    }
  }, [importJSON, load, showToast]);

  const setPanel = useCallback((panel: SidebarPanel) =>
    setEditorState(s => ({ ...s, activePanel: panel })), []);

  const selectBlock = useCallback((id: string | null) =>
    setEditorState(s => ({ ...s, selectedBlockId: id })), []);

  const togglePreview = useCallback(() =>
    setEditorState(s => ({ ...s, previewMode: !s.previewMode, selectedBlockId: null })), []);

  const setZoom = useCallback((zoom: number) =>
    setEditorState(s => ({ ...s, zoom })), []);

  const effectivePreviewMode = routePreview || editorState.previewMode;

  // Route preview mode renders the same Canvas with editor controls disabled.
  if (routePreview) {
    if (!previewDoc) {
      return (
        <div style={{ padding: 24, fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh' }}>
          <h2 style={{ margin: 0 }}>Preview not available</h2>
          <p style={{ opacity: 0.8 }}>Could not load newsletter.json. Place it next to index.html in your hosted folder.</p>
        </div>
      );
    }

    return (
      <div style={{ height: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-body)', overflow: 'auto' }}>
        <Canvas
          newsletter={newsletter}
          editorState={{ ...editorState, previewMode: true, selectedBlockId: null, zoom: 100 }}
          onSelectBlock={() => { /* disabled */ }}
          onMoveBlock={() => { /* disabled */ }}
          onDeleteBlock={() => { /* disabled */ }}
          onDuplicateBlock={() => { /* disabled */ }}
          onAddBlock={() => { /* disabled */ }}
          onUpdateBlock={() => { /* disabled */ }}
          onUpdateArticle={() => { /* disabled */ }}
          onDeleteArticle={() => { /* disabled */ }}
          onMoveArticle={() => { /* disabled */ }}
          onAddArticle={() => { /* disabled */ }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-body)', overflow: 'hidden' }}>
      <TopBar
        newsletter={newsletter}
        editorState={editorState}
        lastSaved={lastSaved}
        onSave={handleSave}
        onSaveVersion={handleSaveVersion}
        onExportJson={() => exportJSON(newsletter)}
        onImport={handleImport}
        onTogglePreview={togglePreview}
        onZoomChange={setZoom}
        onUpdateMeta={updateMeta}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!effectivePreviewMode && (
          <Sidebar
            newsletter={newsletter}
            editorState={editorState}
            rss={rss}
            versions={versions}
            onSetPanel={setPanel}
            onAddBlock={addBlock}
            onSelectBlock={selectBlock}
            onUpdateBlock={updateBlock}
            onUpdateTheme={updateTheme}
            onRestoreVersion={(v) => { load(v.newsletter); showToast('Version restored'); }}
            onDeleteVersion={deleteVersion}
            onAddArticle={addArticle}
            onUpdateArticle={updateArticle}
            onDeleteArticle={deleteArticle}
            onAddQuickHit={addQuickHit}
            onUpdateQuickHit={updateQuickHit}
            onDeleteQuickHit={deleteQuickHit}
          />
        )}

        <Canvas
          newsletter={newsletter}
          editorState={{ ...editorState, previewMode: effectivePreviewMode }}
          onSelectBlock={selectBlock}
          onMoveBlock={moveBlock}
          onDeleteBlock={deleteBlock}
          onDuplicateBlock={duplicateBlock}
          onAddBlock={addBlock}
          onUpdateBlock={updateBlock}
          onUpdateArticle={updateArticle}
          onDeleteArticle={deleteArticle}
          onMoveArticle={moveArticle}
          onAddArticle={addArticle}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'var(--color-primary)', color: '#fff',
          padding: '12px 20px', borderRadius: 12,
          fontFamily: 'var(--font-body)', fontSize: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          animation: 'fadeInUp 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
