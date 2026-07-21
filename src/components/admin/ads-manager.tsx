'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Megaphone, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'

import type { Advertisement, Post } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdsEditor } from './ads-editor'

/**
 * AdsManager — admin table for advertisements. Lists every ad with a preview,
 * placement, target (for inline), status, and order. Create/edit happens
 * inside <AdsEditor>; delete is confirmed via an alert dialog.
 *
 * Also fetches the post list once so the editor's article picker is populated.
 */
export function AdsManager({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [ads, setAds] = useState<Advertisement[] | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Advertisement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Advertisement | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAds = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/advertisements', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load ads')
      const data = (await res.json()) as { ads: Advertisement[] }
      setAds(data.ads)
    } catch {
      toast({ title: 'Could not load ads', variant: 'destructive' })
      setAds([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Fetch ads + the post list (for the editor's article picker).
  useEffect(() => {
    void fetchAds()
    void (async () => {
      try {
        const res = await fetch('/api/admin/posts', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { posts: Post[] }
        setPosts(data.posts)
      } catch {
        // Non-fatal — inline picker just won't populate.
      }
    })()
  }, [fetchAds])

  function openNew() {
    setEditing(null)
    setEditorOpen(true)
  }
  function openEdit(ad: Advertisement) {
    setEditing(ad)
    setEditorOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/advertisements/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Ad deleted' })
      setDeleteTarget(null)
      await fetchAds()
    } catch {
      toast({ title: 'Could not delete ad', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  function postTitle(id: string | null): string {
    if (!id) return '—'
    return posts.find((p) => p.id === id)?.title ?? 'Deleted article'
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Action bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Advertisements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scrolling banners for the homepage and inside articles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openNew} className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90">
            <Plus /> New ad
          </Button>
          <Button variant="outline" onClick={onBack}>
            Back to posts
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Text</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : ads && ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Megaphone className="size-6" />
                    <p className="font-medium">No ads yet.</p>
                    <Button
                      onClick={openNew}
                      size="sm"
                      className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
                    >
                      <Plus /> Create your first ad
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              ads?.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="max-w-[320px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-3 shrink-0 rounded-full border"
                        style={{ backgroundColor: ad.bgColor }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => openEdit(ad)}
                        className="truncate text-left font-medium hover:text-[var(--brand)]"
                        title={ad.text}
                      >
                        {ad.text}
                      </button>
                      {ad.link ? (
                        <Badge variant="outline" className="shrink-0">
                          link
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {ad.placement === 'inline' ? (
                      <Badge variant="secondary">Inline</Badge>
                    ) : (
                      <Badge variant="outline">Homepage</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[220px] text-muted-foreground">
                    {ad.placement === 'inline'
                      ? `${postTitle(ad.postId)} · ¶${ad.paragraphNum ?? 1}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {ad.enabled ? (
                      <Badge className="bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/10">
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ad.order}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ad actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(ad)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(ad)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdsEditor
        open={editorOpen}
        ad={editing}
        posts={posts}
        onOpenChange={(o) => {
          setEditorOpen(o)
          if (!o) setEditing(null)
        }}
        onSaved={fetchAds}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this advertisement?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.text ? (
                <>
                  <span className="font-medium text-foreground">{deleteTarget.text}</span> will be
                  permanently deleted. This action cannot be undone.
                </>
              ) : (
                'This ad will be permanently deleted. This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
