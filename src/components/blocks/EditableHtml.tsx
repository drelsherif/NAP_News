import React, { useEffect, useRef, useState } from 'react';

type Props = {
  html: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Called on blur / commit. Receives the final HTML string. */
  onCommit: (nextHtml: string) => void;
};

/**
 * Minimal rich-text inline editor.
 * - Uses contentEditable and commits innerHTML on blur
 * - Esc reverts
 */
export function EditableHtml({ html, placeholder, className, style, onCommit }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastCommitted = useRef<string>(html ?? '');
  const [draft, setDraft] = useState<string>(html ?? '');

  useEffect(() => {
    lastCommitted.current = html ?? '';
    setDraft(html ?? '');
    if (ref.current && ref.current.innerHTML !== (html ?? '')) {
      ref.current.innerHTML = html ?? '';
    }
  }, [html]);

  const commit = () => {
    const next = ref.current ? ref.current.innerHTML : draft;
    lastCommitted.current = next;
    onCommit(next);
  };

  const revert = () => {
    const prev = lastCommitted.current ?? '';
    setDraft(prev);
    if (ref.current) ref.current.innerHTML = prev;
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ outline: 'none', cursor: 'text', ...(style || {}) }}
      contentEditable
      suppressContentEditableWarning
      data-inline-editor="true"
      data-placeholder={placeholder || ''}
      onInput={(e) => setDraft((e.currentTarget as HTMLDivElement).innerHTML)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          revert();
          (e.currentTarget as HTMLDivElement).blur();
        }
      }}
      dangerouslySetInnerHTML={{ __html: draft || '' }}
    />
  );
}
