import React, { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

// Minimal font-size support via TextStyle.
// Stores fontSize in the span style attribute.
import { Extension } from '@tiptap/core';

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => (element as HTMLElement).style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: { chain: any }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: { chain: any }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    } as any;
  },
});

type Props = {
  html: string;
  placeholder?: string;
  onChangeHtml: (html: string) => void;
  // Inline styles for the editor content area.
  contentStyle?: React.CSSProperties;
};

export function RichTextEditor({ html, placeholder, onChangeHtml, contentStyle }: Props) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: false, linkOnPaste: true }),
      TextStyle,
      Color,
      FontSize,
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: html || '',
    editorProps: {
      attributes: {
        'data-rich-editor': '1',
        style: `outline:none; min-height: 24px; ${contentStyle ? '' : ''}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChangeHtml(editor.getHTML());
    },
  });

  // Keep editor content in sync when switching blocks / undo / load.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = html || '';
    if (current !== next) editor.commands.setContent(next, false);
  }, [editor, html]);

  if (!editor) return null;

  const btnStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    borderRadius: 8,
    padding: '6px 10px',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    cursor: 'pointer',
  };

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  };

  const activeBtn = (active: boolean): React.CSSProperties =>
    active
      ? { background: 'rgba(0,156,222,0.12)', borderColor: 'rgba(0,156,222,0.35)' }
      : {};

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev || '') || '';
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={groupStyle}>
        <button type="button" style={{ ...btnStyle, ...activeBtn(editor.isActive('bold')) }} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" style={{ ...btnStyle, ...activeBtn(editor.isActive('italic')) }} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" style={{ ...btnStyle, ...activeBtn(editor.isActive('underline')) }} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
        <button type="button" style={{ ...btnStyle, ...activeBtn(editor.isActive('bulletList')) }} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" style={{ ...btnStyle, ...activeBtn(editor.isActive('orderedList')) }} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" style={{ ...btnStyle, ...activeBtn(editor.isActive('blockquote')) }} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <button type="button" style={{ ...btnStyle, ...activeBtn(editor.isActive('link')) }} onClick={setLink}>Link</button>

        <span style={{ width: 1, height: 22, background: 'var(--color-border)', margin: '0 2px' }} />

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-muted)' }}>
          Color
          <input
            type="color"
            value={(editor.getAttributes('textStyle').color as string) || '#1A2B4A'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            style={{ width: 28, height: 20, padding: 0, border: '1px solid var(--color-border)', borderRadius: 6, background: 'transparent' }}
          />
        </label>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-muted)' }}>
          Size
          <select
            value={(editor.getAttributes('textStyle').fontSize as string) || ''}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) (editor as any).commands.unsetFontSize();
              else (editor as any).commands.setFontSize(v);
            }}
            style={{ height: 28, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '0 8px', fontFamily: 'var(--font-body)', fontSize: 12 }}
          >
            <option value="">Default</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
          </select>
        </label>

        <button type="button" style={btnStyle} onClick={() => editor.chain().focus().undo().run()}>Undo</button>
        <button type="button" style={btnStyle} onClick={() => editor.chain().focus().redo().run()}>Redo</button>
      </div>

      <div style={{
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 12,
        background: 'var(--color-surface)',
        minHeight: 60,
        ...(contentStyle || {}),
      }}>
        {placeholder && !editor.getText().trim() ? (
          <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>{placeholder}</div>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
