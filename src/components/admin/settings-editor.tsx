'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

import type { SiteSettings } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

// MDXEditor is client-only — load it lazily, never on the server.
const RichTextEditor = dynamic(
  () => import('./rich-text-editor').then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <Skeleton className="h-[320px] w-full rounded-md" /> },
)

/**
 * Edit site-wide settings: name, tagline, accent color, about markdown.
 */
export function SettingsEditor({ onDone }: { onDone: () => void }) {
  const { toast } = useToast()
  const [siteName, setSiteName] = useState('')
  const [tagline, setTagline] = useState('')
  const [accent, setAccent] = useState('#c1272d')
  const [about, setAbout] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load settings')
      const data = (await res.json()) as { settings: SiteSettings }
      const s = data.settings
      setSiteName(s.siteName ?? '')
      setTagline(s.tagline ?? '')
      setAccent(s.accent || '#c1272d')
      setAbout(s.about ?? '')
    } catch {
      toast({
        title: 'Could not load settings',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    if (!siteName.trim()) {
      toast({ title: 'Site name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: siteName.trim(),
          tagline: tagline.trim(),
          about,
          accent: accent.trim() || '#c1272d',
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast({ title: 'Settings saved', description: 'Your changes are live.' })
      onDone()
    } catch {
      toast({
        title: 'Could not save settings',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[320px] w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={onDone} className="w-fit">
          <ArrowLeft /> Back to posts
        </Button>
        <Button
          onClick={() => void handleSave()}
          disabled={saving}
          className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          Save changes
        </Button>
      </div>

      <h1 className="mb-6 font-serif text-3xl tracking-tight">Site settings</h1>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site name</Label>
          <Input
            id="siteName"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="rathin."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="A short, memorable subtitle."
          />
        </div>

        <div className="space-y-2">
          <Label>Accent color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="size-10 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
              aria-label="Pick accent color"
            />
            <Input
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              placeholder="#c1272d"
              className="max-w-[200px]"
            />
            <div
              className="ml-auto hidden h-8 items-center gap-2 rounded-md border px-3 text-sm sm:flex"
              style={{ color: accent }}
            >
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
              Preview
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Used for links, badges, and highlights across the site.
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="about">About</Label>
          <p className="text-xs text-muted-foreground">
            Shown on the About page. Format with the rich text editor.
          </p>
          <RichTextEditor value={about} onChange={setAbout} />
        </div>
      </div>
    </div>
  )
}
