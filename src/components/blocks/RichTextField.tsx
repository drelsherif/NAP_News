import React from 'react';
import { RichTextEditor } from '../editor/RichTextEditor';

type Props = {
  editable?: boolean;
  html: string;
  placeholder?: string;
  onChangeHtml: (html: string) => void;
  wrapperStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  className?: string;
};

/**
 * RichTextField is a thin wrapper that:
 * - In edit mode: renders TipTap toolbar + editor (RichTextEditor)
 * - In read mode: renders normalized HTML for export-fidelity
 */
export function RichTextField({
  editable,
  html,
  placeholder,
  onChangeHtml,
  wrapperStyle,
  contentStyle,
  className,
}: Props) {
  if (!editable) {
    const safe = html || '';
    return (
      <div
        className={className || 'nap-rich'}
        style={wrapperStyle}
        // TipTap output is trusted app-state HTML (not user-provided arbitrary HTML).
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }

  return (
    <div style={wrapperStyle} className={className}>
      <RichTextEditor
        html={html || (placeholder ? `<p style="opacity:.7">${placeholder}</p>` : '')}
        onChangeHtml={onChangeHtml}
        contentStyle={contentStyle}
      />
    </div>
  );
}
