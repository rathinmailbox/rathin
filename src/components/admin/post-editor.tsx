'use client'

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import dynamic from 'next/dynamic'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react'

import type { Post } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

// MDXEditor is client-only — load it lazily, never on the server.
const RichTextEditor = dynamic(
  () => import('./rich-text-editor').then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <Skeleton className="h-[360px] w-full rounded-md" /> },
)

interface FormState {
  title: string
  excerpt: string
  content: string
  coverImage: string
  author: string
  category: string
  tags: string
  published: boolean
  featured: boolean
  /** ISO date string (yyyy-mm-dd) for the published date, or '' for now. */
  publishedAt: string
}

const EMPTY: FormState = {
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  author: 'Staff',
  category: 'General',
  tags: '',
  published: false,
  featured: false,
  publishedAt: '',
}

/**
 * Create or edit a post. postId === null means a new post.
 */
export function PostEditor({ postId, onDone }: { postId: string | null; onDone: () => void }) {
  const { toast } = useToast()
  const isNew = postId === null

  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const loadPost = useCallback(async () => {
    if (postId === null) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load post')
      const data = (await res.json()) as { post: Post }
      const p = data.post
      setForm({
        title: p.title ?? '',
        excerpt: p.excerpt ?? '',
        content: p.content ?? '',
        coverImage: p.coverImage ?? '',
        author: p.author ?? 'Staff',
        category: p.category ?? 'General',
        tags: p.tags ?? '',
        published: !!p.published,
        featured: !!p.featured,
        // Convert the ISO timestamp to a yyyy-mm-dd value for the date input.
        publishedAt: p.createdAt ? p.createdAt.slice(0, 10) : '',
      })
    } catch {
      toast({
        title: 'Could not load post',
        description: 'Please go back and try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [postId, toast])

  useEffect(() => {
    void loadPost()
  }, [loadPost])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function persist(overrides?: Partial<FormState>) {
    const payload = { ...form, ...overrides }
    if (!payload.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' })
      return false
    }
    setSaving(true)
    try {
      const body = {
        title: payload.title.trim(),
        excerpt: payload.excerpt.trim(),
        // Unescape brackets that MDXEditor's remark parser mangles
        // (\[\[ → [[) so footnote syntax is preserved on save.
        content: payload.content
          .replace(/\\\[\\\[/g, '[[')
          .replace(/\\\]\\\]/g, ']]'),
        coverImage: payload.coverImage.trim() || null,
        author: payload.author.trim() || 'Staff',
        category: payload.category.trim() || 'General',
        tags: payload.tags.trim(),
        published: payload.published,
        featured: payload.featured,
        // Send the chosen date (or null to keep the server default).
        publishedAt: payload.publishedAt || null,
      }
      const res = isNew
        ? await fetch('/api/admin/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/admin/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
      if (!res.ok) throw new Error('Save failed')
      toast({ title: 'Saved', description: payload.published ? 'Post published.' : 'Draft saved.' })
      onDone()
      return true
    } catch {
      toast({
        title: 'Could not save',
        description: 'Please try again.',
        variant: 'destructive',
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (postId === null) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Post deleted' })
      onDone()
    } catch {
      toast({
        title: 'Could not delete',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
      setConfirmDelete(false)
    }
  }

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setCoverUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')
      const data = (await res.json()) as { url?: string }
      if (!data.url) throw new Error('Missing URL')

      update('coverImage', data.url)
      toast({ title: 'Cover image uploaded', description: 'The new image is ready to save.' })
    } catch {
      toast({
        title: 'Image upload failed',
        description: 'Please try again with a different image.',
        variant: 'destructive',
      })
    } finally {
      setCoverUploading(false)
      event.target.value = ''
    }
  }

  async function handleGenerateImage() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      })
      if (!res.ok) throw new Error('Image generation failed')
      const data = (await res.json()) as { url: string }
      update('coverImage', data.url)
      toast({ title: 'Image generated', description: 'Cover image updated.' })
      setAiOpen(false)
      setAiPrompt('')
    } catch {
      toast({
        title: 'Image generation failed',
        description: 'Please try a different prompt.',
        variant: 'destructive',
      })
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-[360px] w-full" />
          </div>
          <Skeleton className="h-[420px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Button variant="ghost" size="sm" onClick={onDone} className="w-fit">
          <ArrowLeft /> Back to posts
        </Button>
        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
          <Button
            variant="outline"
            onClick={() => void persist()}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" /> : null}
            Save draft
          </Button>
          {form.published ? (
            <Button
              variant="outline"
              onClick={() => void persist({ published: false })}
              disabled={saving}
            >
              <EyeOff /> Unpublish
            </Button>
          ) : (
            <Button
              onClick={() => void persist({ published: true })}
              disabled={saving}
              className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
            >
              <Eye /> Publish
            </Button>
          )}
          {!isNew ? (
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 /> Delete
            </Button>
          ) : null}
        </div>
      </div>

      {/* Title (full width, large) */}
      <Input
        value={form.title}
        onChange={(e) => update('title', e.target.value)}
        placeholder="Post title"
        className="mb-6 h-14 border-0 bg-transparent px-0 font-serif text-3xl shadow-none focus-visible:ring-0 sm:text-4xl"
        aria-label="Post title"
      />

      {/* 2-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) => update('excerpt', e.target.value)}
              placeholder="A short summary shown on cards and previews."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              A short summary shown on cards and previews.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <RichTextEditor value={form.content} onChange={(md) => update('content', md)} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Cover image */}
          <section className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Cover image</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Optional. Leave empty for a centered, text-only article header.
            </p>
            <div className="space-y-3">
              <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
                {form.coverImage ? (
                  <img
                    src={form.coverImage}
                    alt="Cover preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-8" />
                  </div>
                )}
              </div>
              <Input
                value={form.coverImage}
                onChange={(e) => update('coverImage', e.target.value)}
                placeholder="Paste image URL"
              />
              {form.coverImage ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => update('coverImage', '')}
                  disabled={coverUploading}
                >
                  <Trash2 /> Remove image
                </Button>
              ) : null}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
              >
                {coverUploading ? <Loader2 className="animate-spin" /> : <ImageIcon />}
                {coverUploading ? 'Uploading…' : 'Upload image'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setAiOpen(true)}
              >
                <Sparkles className="text-[var(--brand)]" /> Generate with AI
              </Button>
            </div>
          </section>

          {/* Post meta */}
          <section className="space-y-4 rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold">Details</h3>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(e) => update('author', e.target.value)}
                placeholder="Staff"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                placeholder="General"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => update('tags', e.target.value)}
                placeholder="design, research"
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Published date</Label>
              <Input
                id="publishedAt"
                type="date"
                value={form.publishedAt}
                onChange={(e) => update('publishedAt', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for today. Sets the date shown on the article and homepage.
              </p>
            </div>
          </section>

          {/* Toggles */}
          <section className="space-y-4 rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold">Visibility</h3>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="published" className="flex items-center gap-2">
                  {form.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  Published
                </Label>
                <p className="text-xs text-muted-foreground">Visible on the public site.</p>
              </div>
              <Switch
                id="published"
                checked={form.published}
                onCheckedChange={(v) => update('published', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="featured" className="flex items-center gap-2">
                  <Star className="size-4 text-[var(--brand)]" />
                  Featured
                </Label>
                <p className="text-xs text-muted-foreground">Pin to top of homepage.</p>
              </div>
              <Switch
                id="featured"
                checked={form.featured}
                onCheckedChange={(v) => update('featured', v)}
              />
            </div>
          </section>
        </aside>
      </div>

      {/* AI image dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate a cover image</DialogTitle>
            <DialogDescription>
              Describe the image you want. The AI will create a unique illustration for your post.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">Prompt</Label>
            <Textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. a moody black-and-white photograph of a rainy city street at night"
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleGenerateImage()}
              disabled={aiLoading || !aiPrompt.trim()}
              className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
            >
              {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              {form.title ? (
                <>
                  <span className="font-medium text-foreground">{form.title}</span> will be
                  permanently deleted. This action cannot be undone.
                </>
              ) : (
                'This post will be permanently deleted. This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
              disabled={saving}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
