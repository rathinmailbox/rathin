'use client'

import '@mdxeditor/editor/style.css'
import { useRef } from 'react'

import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  quotePlugin,
  thematicBreakPlugin,
  imagePlugin,
  codeBlockPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ListsToggle,
  CreateLink,
  InsertImage,
  InsertThematicBreak,
  InsertCodeBlock,
  Separator,
  UndoRedo,
} from '@mdxeditor/editor'

/**
 * Rich text editor backed by MDXEditor. Stores content as markdown.
 * Includes a custom "Footnote" button that inserts a `[[note]]` token —
 * the article renderer (Tufte CSS sidenotes) turns these into margin
 * sidenotes. Client-only — must be dynamically imported with ssr:false.
 */
export function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (md: string) => void
}) {
  const editorRef = useRef<MDXEditorMethods>(null)

  /** Insert a footnote placeholder at the cursor. */
  function insertFootnote() {
    editorRef.current?.insertMarkdown('[[footnote text]]')
    editorRef.current?.focus()
  }

  return (
    <div className="admin-rte-wrapper overflow-hidden rounded-md border border-input bg-background">
      <MDXEditor
        ref={editorRef}
        markdown={value ?? ''}
        onChange={onChange}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <Separator />
                <InsertThematicBreak />
                <InsertCodeBlock />
                <Separator />
                <button
                  type="button"
                  onClick={insertFootnote}
                  title="Insert footnote (shown in the margin)"
                  className="inline-flex h-8 items-center justify-center rounded px-2 text-sm font-medium hover:bg-accent"
                >
                  Footnote
                </button>
              </div>
            ),
          }),
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          imagePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'plain' }),
          markdownShortcutPlugin(),
        ]}
        contentEditableClassName="prose-article min-h-[320px] px-4 py-3 focus:outline-none"
      />
    </div>
  )
}
