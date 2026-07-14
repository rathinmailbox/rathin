'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ExternalLink,
  Loader2,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings as SettingsIcon,
  Star,
  Trash2,
} from 'lucide-react'

import type { Post } from '@/lib/types'
import { navPath } from '@/lib/nav'
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

/**
 * Posts dashboard: lists every post (drafts + published), with create / edit / delete.
 */
export function AdminDashboard({
  onEditPost,
  onNewPost,
  onOpenSettings,
  onLoggedOut,
}: {
  onEditPost: (id: string) => void
  onNewPost: () => void
  onOpenSettings: () => void
  onLoggedOut: () => void
}) {
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/posts', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load posts')
      const data = (await res.json()) as { posts: Post[] }
      setPosts(data.posts)
    } catch {
      toast({
        title: 'Could not load posts',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      })
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      toast({ title: 'Signed out' })
      onLoggedOut()
    } finally {
      setLoggingOut(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/posts/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Post deleted', description: deleteTarget.title })
      setDeleteTarget(null)
      await fetchPosts()
    } catch {
      toast({
        title: 'Could not delete post',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Action bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your editorial content.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onNewPost} className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90">
            <Plus /> New post
          </Button>
          <Button variant="outline" onClick={onOpenSettings}>
            <SettingsIcon /> Settings
          </Button>
          <Button asChild variant="outline">
            <a href={navPath('home')} target="_blank" rel="noopener noreferrer">
              View site <ExternalLink />
            </a>
          </Button>
          <Button variant="ghost" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : posts && posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <p className="font-medium">No posts yet.</p>
                    <Button
                      onClick={onNewPost}
                      size="sm"
                      className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
                    >
                      <Plus /> Create your first post
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              posts?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-[320px]">
                    <button
                      type="button"
                      onClick={() => onEditPost(post.id)}
                      className="truncate text-left font-medium hover:text-[var(--brand)]"
                      title={post.title}
                    >
                      {post.title || <span className="italic text-muted-foreground">Untitled</span>}
                    </button>
                  </TableCell>
                  <TableCell>
                    {post.category ? (
                      <Badge variant="secondary">{post.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {post.published ? (
                      <Badge className="bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/10">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {post.featured ? (
                      <Star className="size-4 fill-[var(--brand)] text-[var(--brand)]" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(post.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Post actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditPost(post.id)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(post)}
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

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title ? (
                <>
                  <span className="font-medium text-foreground">{deleteTarget.title}</span> will be
                  permanently deleted. This action cannot be undone.
                </>
              ) : (
                'This post will be permanently deleted. This action cannot be undone.'
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
