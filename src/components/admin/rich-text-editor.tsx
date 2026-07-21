'use client'

import '@mdxeditor/editor/style.css'
import { useRef, useState, type ChangeEvent } from 'react'

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
  InsertThematicBreak,
  InsertCodeBlock,
  Separator,
  UndoRedo,
} from '@mdxeditor/editor'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  /** Insert a footnote placeholder at the cursor. */
  function insertFootnote() {
    editorRef.current?.insertMarkdown('[[footnote text]]')
    editorRef.current?.focus()
  }

  function insertMarkdownImage(url: string, altText = '') {
    const safeAlt = altText.trim() || 'image'
    editorRef.current?.insertMarkdown(`![${safeAlt}](${url})`)
    editorRef.current?.focus()
  }

  async function handleInsertImage() {
    const trimmedUrl = imageUrl.trim()
    if (!trimmedUrl && !imageFile) return

    setUploadingImage(true)
    try {
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Upload failed')
        const data = (await res.json()) as { url?: string }
        if (!data.url) throw new Error('Missing URL')

        insertMarkdownImage(data.url, imageAlt)
      } else if (trimmedUrl) {
        insertMarkdownImage(trimmedUrl, imageAlt)
      }

      setImageUrl('')
      setImageAlt('')
      setImageFile(null)
      setIsImageDialogOpen(false)
    } catch {
      window.alert('Could not insert the image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  function handleImageFilePick(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0] ?? null)
  }

  function insertEmbed() {
    const html = window.prompt('Paste the embed HTML, iframe, or other snippet to insert:')
    if (!html || !html.trim()) return

    const block = `:::embed\n<div class="embed-block">\n${html.trim()}\n</div>\n:::\n`
    editorRef.current?.insertMarkdown(block)
    editorRef.current?.focus()
  }

  return (
    <div className="admin-rte-wrapper overflow-hidden rounded-md border border-input bg-background">
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert an image</DialogTitle>
            <DialogDescription>
              Paste an image URL or upload a file from your device. The image will be inserted into the post body.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt text</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="A short description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-file">Upload from device</Label>
              <Input id="image-file" type="file" accept="image/*" onChange={handleImageFilePick} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleInsertImage()} disabled={uploadingImage}>
              {uploadingImage ? 'Uploading…' : 'Insert image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <button
                  type="button"
                  onClick={() => setIsImageDialogOpen(true)}
                  className="inline-flex h-8 items-center justify-center rounded px-2 text-sm font-medium hover:bg-accent"
                >
                  Insert image
                </button>
                <button
                  type="button"
                  onClick={insertEmbed}
                  title="Insert an embeddable HTML block"
                  className="inline-flex h-8 items-center justify-center rounded px-2 text-sm font-medium hover:bg-accent"
                >
                  Embed
                </button>
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
