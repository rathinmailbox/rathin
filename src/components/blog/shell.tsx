'use client'

import { useEffect } from 'react'
import { Masthead } from '@/components/blog/masthead'
import { SiteFooter } from '@/components/blog/site-footer'
import { ThemeToggle } from '@/components/blog/theme-toggle'
import type { SiteSettings, View } from '@/lib/types'

interface ShellProps {
  settings: SiteSettings
  view: View
  slug?: string
  children: React.ReactNode
}

/**
 * Top-level layout wrapper for the Gawker-style redesign.
 * - Applies the runtime accent color (`--brand`).
 * - Public pages: giant Masthead on top (no menu bar, no dark-mode toggle),
 *   content in the middle, Footer (which holds ALL navigation) at the bottom.
 * - Admin: rendered full-bleed with its own chrome.
 * Scrolls to top on view change.
 */
export function Shell({ settings, view, slug, children }: ShellProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [view, slug])

  const style = { '--brand': settings.accent } as React.CSSProperties

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-background text-foreground" style={style}>
        {children}
      </div>
    )
  }

  return (
    <div
      className="page-bg flex min-h-screen flex-col text-foreground"
      style={style}
    >
      <ThemeToggle />
      {/* Article pages render their own wordmark under the cover image, so
          the top masthead is skipped there to avoid duplication. */}
      {view !== 'article' && <Masthead siteName={settings.siteName} />}
      <main className="flex-1">{children}</main>
      <SiteFooter siteName={settings.siteName} tagline={settings.tagline} />
    </div>
  )
}
