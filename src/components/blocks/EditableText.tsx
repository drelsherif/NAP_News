import React, { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
  className?: string;
  /** Called on blur / commit. Receives the final text value (trim is NOT applied). */
  onCommit: (next: string) => void;
};

/**
 * Lightweight inline editor for block text.
 * - Uses contentEditable (no external deps)
 * - Commits on blur
 * - Enter commits for single-line (prevents newline)
 * - Esc reverts to last committed value
 */
export function EditableText({ value, placeholder, multiline = false, style, className, onCommit }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastCommitted = useRef<string>(value ?? '');
  const [draft, setDraft] = useState<string>(value ?? '');

  useEffect(() => {
    // Keep editor in sync when selection changes or external updates occur.
    lastCommitted.current = value ?? '';
    setDraft(value ?? '');
    if (ref.current && ref.current.innerText !== (value ?? '')) {
      ref.current.innerText = value ?? '';
    }
  }, [value]);

  const commit = () => {
    const next = ref.current ? ref.current.innerText : draft;
    lastCommitted.current = next;
    onCommit(next);
  };

  const revert = () => {
    const prev = lastCommitted.current ?? '';
    setDraft(prev);
    if (ref.current) ref.current.innerText = prev;
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        outline: 'none',
        cursor: 'text',
        whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
        ...(style || {}),
      }}
      contentEditable
      suppressContentEditableWarning
      data-inline-editor="true"
      onInput={(e) => setDraft((e.currentTarget as HTMLDivElement).innerText)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          revert();
          (e.currentTarget as HTMLDivElement).blur();
        }
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          commit();
          (e.currentTarget as HTMLDivElement).blur();
        }
      }}
      data-placeholder={placeholder || ''}
    >
      {draft}
    </div>
  );
}
