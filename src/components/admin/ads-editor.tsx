'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import type { AdPlacement, Advertisement, Post } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { MarqueeAd } from '@/components/blog/marquee-ad'

type Draft = {
  text: string
  link: string
  bgColor: string
  textColor: string
  speed: number
  placement: AdPlacement
  postId: string
  paragraphNum: number
  enabled: boolean
  order: number
}

function emptyDraft(): Draft {
  return {
    text: '',
    link: '',
    bgColor: '#ff0000',
    textColor: '#ffffff',
    speed: 20,
    placement: 'home',
    postId: '',
    paragraphNum: 1,
    enabled: true,
    order: 0,
  }
}

function adToDraft(ad: Advertisement): Draft {
  return {
    text: ad.text,
    link: ad.link ?? '',
    bgColor: ad.bgColor,
    textColor: ad.textColor,
    speed: ad.speed,
    placement: ad.placement,
    postId: ad.postId ?? '',
    paragraphNum: ad.paragraphNum ?? 1,
    enabled: ad.enabled,
    order: ad.order,
  }
}

/**
 * AdsEditor — modal form for creating/editing an advertisement.
 *
 * Shows a live marquee preview at the top that updates as fields change.
 * Caller controls open state and passes the ad to edit (or null for new).
 */
export function AdsEditor({
  open,
  ad,
  posts,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  ad: Advertisement | null
  posts: Post[]
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [saving, setSaving] = useState(false)

  // Hydrate the draft whenever the dialog opens or the target ad changes.
  useEffect(() => {
    if (open) {
      setDraft(ad ? adToDraft(ad) : emptyDraft())
    }
  }, [open, ad])

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function handleSave() {
    if (!draft.text.trim()) {
      toast({ title: 'Ad text is required', variant: 'destructive' })
      return
    }
    if (draft.placement === 'inline' && !draft.postId) {
      toast({ title: 'Pick an article for the inline ad', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        text: draft.text.trim(),
        link: draft.link.trim() || null,
        bgColor: draft.bgColor,
        textColor: draft.textColor,
        speed: draft.speed,
        placement: draft.placement,
        postId: draft.placement === 'inline' ? draft.postId : null,
        paragraphNum: draft.placement === 'inline' ? draft.paragraphNum : null,
        enabled: draft.enabled,
        order: draft.order,
      }

      const res = ad
        ? await fetch(`/api/admin/advertisements/${ad.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/advertisements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Save failed')
      }

      toast({ title: ad ? 'Ad updated' : 'Ad created' })
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast({
        title: 'Could not save ad',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const previewText = draft.text.trim() || 'Your ad text will scroll here'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{ad ? 'Edit advertisement' : 'New advertisement'}</DialogTitle>
          <DialogDescription>
            Custom scrolling banner. Live preview below updates as you type.
          </DialogDescription>
        </DialogHeader>

        {/* Live preview */}
        <div className="overflow-hidden rounded-md">
          <MarqueeAd
            text={previewText}
            link={null}
            bgColor={draft.bgColor}
            textColor={draft.textColor}
            speed={draft.speed}
          />
        </div>

        <div className="grid gap-4">
          {/* Text */}
          <div className="grid gap-2">
            <Label htmlFor="ad-text">Ad text</Label>
            <Textarea
              id="ad-text"
              value={draft.text}
              onChange={(e) => update('text', e.target.value)}
              placeholder="BUY TICKETS TO THE SHOW — JULY 30"
              rows={2}
            />
          </div>

          {/* Link */}
          <div className="grid gap-2">
            <Label htmlFor="ad-link">Link (optional)</Label>
            <Input
              id="ad-link"
              value={draft.link}
              onChange={(e) => update('link', e.target.value)}
              placeholder="https://example.com/tickets"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ad-bg">Background color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="ad-bg"
                  type="color"
                  value={draft.bgColor}
                  onChange={(e) => update('bgColor', e.target.value)}
                  className="size-9 cursor-pointer rounded border border-border bg-background p-1"
                />
                <Input
                  value={draft.bgColor}
                  onChange={(e) => update('bgColor', e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ad-fg">Text color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="ad-fg"
                  type="color"
                  value={draft.textColor}
                  onChange={(e) => update('textColor', e.target.value)}
                  className="size-9 cursor-pointer rounded border border-border bg-background p-1"
                />
                <Input
                  value={draft.textColor}
                  onChange={(e) => update('textColor', e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Speed */}
          <div className="grid gap-2">
            <Label htmlFor="ad-speed">Scroll speed (seconds per pass — lower is faster)</Label>
            <Input
              id="ad-speed"
              type="number"
              min={2}
              max={120}
              value={draft.speed}
              onChange={(e) =>
                update('speed', Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 20)
              }
            />
          </div>

          {/* Placement */}
          <div className="grid gap-2">
            <Label htmlFor="ad-placement">Placement</Label>
            <Select
              value={draft.placement}
              onValueChange={(v) => {
                const next = v === 'inline' ? 'inline' : v === 'home-top' ? 'home-top' : 'home'
                update('placement', next)
              }}
            >
              <SelectTrigger id="ad-placement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home-top">Homepage — below the logo</SelectItem>
                <SelectItem value="home">Homepage — stacked at bottom</SelectItem>
                <SelectItem value="inline">Inline — inside an article</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inline-only fields */}
          {draft.placement === 'inline' ? (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-dashed p-3">
              <div className="grid gap-2">
                <Label htmlFor="ad-post">Article</Label>
                <Select value={draft.postId} onValueChange={(v) => update('postId', v)}>
                  <SelectTrigger id="ad-post">
                    <SelectValue placeholder="Select article" />
                  </SelectTrigger>
                  <SelectContent>
                    {posts.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No articles available
                      </SelectItem>
                    ) : (
                      posts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title || 'Untitled'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ad-para">After paragraph #</Label>
                <Input
                  id="ad-para"
                  type="number"
                  min={0}
                  value={draft.paragraphNum}
                  onChange={(e) =>
                    update(
                      'paragraphNum',
                      Number.isFinite(Number(e.target.value))
                        ? Math.max(0, Number(e.target.value))
                        : 0,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">0 = top of the article.</p>
              </div>
            </div>
          ) : null}

          {/* Enabled + order */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="ad-enabled"
                checked={draft.enabled}
                onCheckedChange={(v) => update('enabled', v)}
              />
              <Label htmlFor="ad-enabled">Enabled</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ad-order" className="text-right">
                Order
              </Label>
              <Input
                id="ad-order"
                type="number"
                value={draft.order}
                onChange={(e) =>
                  update(
                    'order',
                    Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0,
                  )
                }
                className="w-20"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90">
            {saving ? <Loader2 className="animate-spin" /> : null}
            {ad ? 'Save changes' : 'Create ad'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
