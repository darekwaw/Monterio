'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { useState, useCallback, useEffect } from 'react';
import {
  Bold, Italic, UnderlineIcon, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link2, Code2,
  Heading2, Heading3, Undo, Redo, Table as TableIcon,
  Plus, Minus, Columns2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EditorToken {
  code: string;
  label: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  tokens?: EditorToken[];
  minHeight?: number;
}

function ToolbarButton({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'rounded p-1.5 text-sm transition-colors',
        active ? 'bg-accent-50 text-accent-700' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, tokens = [], minHeight = 300 }: RichTextEditorProps) {
  const [sourceMode, setSourceMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
    setRawHtml(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const toggleSourceMode = useCallback(() => {
    if (!editor) return;
    if (!sourceMode) {
      setRawHtml(editor.getHTML());
    } else {
      editor.commands.setContent(rawHtml);
      onChange(rawHtml);
    }
    setSourceMode(v => !v);
  }, [editor, sourceMode, rawHtml, onChange]);

  const insertToken = useCallback((code: string) => {
    const text = `{{${code}}}`;
    if (sourceMode) {
      setRawHtml(h => h + text);
      onChange(rawHtml + text);
    } else {
      editor?.commands.insertContent(text);
    }
  }, [editor, sourceMode, rawHtml, onChange]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL:', editor.getAttributes('link').href ?? '');
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const isInTable = editor?.isActive('table') ?? false;

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-300 focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-500/20">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-200 bg-stone-50 px-2 py-1.5">
        {!sourceMode && (
          <>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Pogrubienie">
              <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Kursywa">
              <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Podkreślenie">
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-stone-300" />

            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Nagłówek H2">
              <Heading2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Nagłówek H3">
              <Heading3 className="h-3.5 w-3.5" />
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-stone-300" />

            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista punktowana">
              <List className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerowana">
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-stone-300" />

            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Do lewej">
              <AlignLeft className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Wyśrodkuj">
              <AlignCenter className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Do prawej">
              <AlignRight className="h-3.5 w-3.5" />
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-stone-300" />

            <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
              <Link2 className="h-3.5 w-3.5" />
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-stone-300" />

            {/* Tabela — dropdown */}
            <div className="relative">
              <ToolbarButton
                onClick={() => setTableMenuOpen(v => !v)}
                active={isInTable || tableMenuOpen}
                title="Tabela"
              >
                <TableIcon className="h-3.5 w-3.5" />
              </ToolbarButton>

              {tableMenuOpen && (
                <div
                  className="absolute top-full left-0 z-50 mt-1 min-w-[180px] rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
                  onMouseLeave={() => setTableMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run();
                      setTableMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                  >
                    <TableIcon className="h-3.5 w-3.5 text-stone-400" />
                    Wstaw tabelę 2×2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                      setTableMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                  >
                    <TableIcon className="h-3.5 w-3.5 text-stone-400" />
                    Wstaw tabelę 3×3 z nagłówkiem
                  </button>

                  {isInTable && (
                    <>
                      <div className="my-1 h-px bg-stone-100" />
                      <button
                        type="button"
                        onClick={() => { editor.chain().focus().addColumnAfter().run(); setTableMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                      >
                        <Plus className="h-3.5 w-3.5 text-stone-400" />
                        Dodaj kolumnę
                      </button>
                      <button
                        type="button"
                        onClick={() => { editor.chain().focus().addRowAfter().run(); setTableMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                      >
                        <Plus className="h-3.5 w-3.5 text-stone-400" />
                        Dodaj wiersz
                      </button>
                      <button
                        type="button"
                        onClick={() => { editor.chain().focus().deleteColumn().run(); setTableMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                      >
                        <Minus className="h-3.5 w-3.5 text-stone-400" />
                        Usuń kolumnę
                      </button>
                      <button
                        type="button"
                        onClick={() => { editor.chain().focus().deleteRow().run(); setTableMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                      >
                        <Minus className="h-3.5 w-3.5 text-stone-400" />
                        Usuń wiersz
                      </button>
                      <button
                        type="button"
                        onClick={() => { editor.chain().focus().mergeCells().run(); setTableMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                      >
                        <Columns2 className="h-3.5 w-3.5 text-stone-400" />
                        Scal komórki
                      </button>
                      <div className="my-1 h-px bg-stone-100" />
                      <button
                        type="button"
                        onClick={() => { editor.chain().focus().deleteTable().run(); setTableMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                        Usuń tabelę
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mx-1 h-4 w-px bg-stone-300" />

            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Cofnij">
              <Undo className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Ponów">
              <Redo className="h-3.5 w-3.5" />
            </ToolbarButton>
          </>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={toggleSourceMode}
          title={sourceMode ? 'Widok wizualny' : 'Edytor HTML'}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
            sourceMode ? 'border border-accent-300 bg-accent-50 text-accent-700' : 'text-stone-500 hover:bg-stone-100'
          )}
        >
          <Code2 className="h-3.5 w-3.5" />
          {sourceMode ? 'Widok' : 'HTML'}
        </button>
      </div>

      {/* Tokeny */}
      {tokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-stone-200 bg-stone-50 px-3 py-2">
          <span className="mr-1 self-center text-xs text-stone-400">Wstaw:</span>
          {tokens.map(t => (
            <button
              key={t.code}
              type="button"
              onClick={() => insertToken(t.code)}
              title={`{{${t.code}}}`}
              className="rounded border border-accent-200 bg-accent-50 px-2 py-0.5 text-xs text-accent-700 transition-colors hover:bg-accent-100"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Edytor */}
      {sourceMode ? (
        <textarea
          value={rawHtml}
          onChange={e => { setRawHtml(e.target.value); onChange(e.target.value); }}
          className="w-full resize-y bg-ink-950 px-3 py-2 font-mono text-xs text-green-400 focus:outline-none"
          style={{ minHeight }}
          spellCheck={false}
        />
      ) : (
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-4 py-3 focus:outline-none [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-stone-300 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-stone-300 [&_th]:bg-stone-100 [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-semibold"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
