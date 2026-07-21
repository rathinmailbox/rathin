'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, LogOut } from 'lucide-react'

import { navPath } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { AdminLogin } from './admin-login'
import { AdminDashboard } from './admin-dashboard'
import { PostEditor } from './post-editor'
import { SettingsEditor } from './settings-editor'

type SubView = 'dashboard' | 'editor' | 'settings'

/**
 * Root admin component. Renders login, dashboard, editor, or settings
 * based on auth state and the active sub-view.
 */
export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [subView, setSubView] = useState<SubView>('dashboard')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  // Check session on mount.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/admin/session', { cache: 'no-store' })
        if (!res.ok) throw new Error('session check failed')
        const data = (await res.json()) as { authenticated: boolean }
        if (!cancelled) setAuthed(data.authenticated)
      } catch {
        if (!cancelled) setAuthed(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setAuthed(false)
      setSubView('dashboard')
      setEditingId(null)
    } finally {
      setLoggingOut(false)
    }
  }

  // Loading session check.
  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-[var(--brand)]" />
          <p className="text-sm">Loading admin…</p>
        </div>
      </div>
    )
  }

  // Not authenticated → login screen.
  if (!authed) {
    return <AdminLogin onLoggedIn={() => setAuthed(true)} />
  }

  // Authenticated → render the active sub-view inside slim admin chrome.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Slim global admin top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href={navPath('admin')}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <span className="font-serif text-base">rathin.blog</span>
            <span className="text-muted-foreground">— Admin</span>
          </a>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <a href={navPath('home')} target="_blank" rel="noopener noreferrer">
                <span className="hidden sm:inline">View site</span>
                <ExternalLink className="sm:hidden" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Active sub-view */}
      <main className="flex-1">
        {subView === 'dashboard' ? (
          <AdminDashboard
            onEditPost={(id) => {
              setEditingId(id)
              setSubView('editor')
            }}
            onNewPost={() => {
              setEditingId(null)
              setSubView('editor')
            }}
            onOpenSettings={() => setSubView('settings')}
            onLoggedOut={() => {
              setAuthed(false)
              setSubView('dashboard')
            }}
          />
        ) : null}
        {subView === 'editor' ? (
          <PostEditor postId={editingId} onDone={() => setSubView('dashboard')} />
        ) : null}
        {subView === 'settings' ? (
          <SettingsEditor onDone={() => setSubView('dashboard')} />
        ) : null}
      </main>
    </div>
  )
}
