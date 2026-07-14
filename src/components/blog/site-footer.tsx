import Link from 'next/link'
import { navPath } from '@/lib/nav'

/**
 * SiteFooter — Gawker-style footer holding the navigation links, centered.
 * Lists Home, About, and Feed. Admin is intentionally NOT linked here — it
 * remains accessible by typing /admin directly into the address bar.
 */
export function SiteFooter({ siteName }: { siteName: string; tagline?: string }) {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-black/10 bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <nav aria-label="Footer" className="footer-nav-big">
          <Link href={navPath('home')}>Home</Link>
          <Link href={navPath('about')}>About</Link>
          <Link href="/feed">Feed</Link>
        </nav>
        <p className="footer-copy mt-8">
          &copy; {year} {siteName}
        </p>
      </div>
    </footer>
  )
}
