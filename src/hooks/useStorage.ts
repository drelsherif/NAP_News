import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Newsletter, SaveVersion } from '../types';

const AUTOSAVE_KEY = 'nap:autosave';
const VERSIONS_KEY = 'nap:versions';

export function useStorage() {
  const [versions, setVersions] = useState<SaveVersion[]>(() => {
    try { return JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]'); }
    catch { return []; }
  });

  const autosave = useCallback((newsletter: Newsletter) => {
    try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(newsletter)); }
    catch { console.warn('Autosave failed'); }
  }, []);

  const loadAutosave = useCallback((): Newsletter | null => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const saveVersion = useCallback((newsletter: Newsletter, label?: string) => {
    const version: SaveVersion = {
      id: uuidv4(),
      label: label || `Version ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      newsletter,
    };
    setVersions(prev => {
      const next = [version, ...prev].slice(0, 20);
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteVersion = useCallback((id: string) => {
    setVersions(prev => {
      const next = prev.filter(v => v.id !== id);
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const exportJSON = useCallback((newsletter: Newsletter) => {
    const blob = new Blob([JSON.stringify(newsletter, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nap-issue-${newsletter.meta.issueNumber || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importJSON = useCallback((file: File): Promise<Newsletter> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try { resolve(JSON.parse(e.target?.result as string)); }
        catch { reject(new Error('Invalid JSON file')); }
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsText(file);
    });
  }, []);

  return { versions, autosave, loadAutosave, saveVersion, deleteVersion, exportJSON, importJSON };
}

// ─── Autosave effect ──────────────────────────────────────────────────────────

export function useAutosave(newsletter: Newsletter, autosaveFn: (nl: Newsletter) => void, intervalMs = 30_000) {
  useEffect(() => {
    const timer = setInterval(() => autosaveFn(newsletter), intervalMs);
    return () => clearInterval(timer);
  }, [newsletter, autosaveFn, intervalMs]);
}
