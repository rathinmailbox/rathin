export type View = 'home' | 'article' | 'about' | 'admin' | 'drafts'

/**
 * Build a clean path for a given view.
 * - home   → /
 * - about  → /about
 * - admin  → /admin
 * - drafts → /drafts
 * - article → /article/{slug}
 *
 * The clean paths are rewritten to /?p=<view>&... by next.config.ts rewrites,
 * so the single src/app/page.tsx route still handles them. The browser
 * address bar shows the clean path.
 */
export function navPath(view: View, params?: Record<string, string | undefined>): string {
  switch (view) {
    case 'home':
      return '/'
    case 'about':
      return '/about'
    case 'admin':
      return '/admin'
    case 'drafts':
      return '/drafts'
    case 'article': {
      const slug = params?.slug
      return slug ? `/article/${slug}` : '/'
    }
    default:
      return '/'
  }
}
