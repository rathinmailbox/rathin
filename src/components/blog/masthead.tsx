import Link from 'next/link'
import { navPath } from '@/lib/nav'

/**
 * Masthead — the giant Gawker-style site wordmark at the top of the public
 * pages (home + about). SERIF + extra-extra-extra bold (900), lowercase, and
 * oversized so it is only PARTIALLY visible — it bleeds off both edges AND
 * has its top ~10% cropped by the page top. No background box, no navigation.
 *
 * The base text ("rathin") links home. The trailing period is the easter
 * egg: hovering it reveals a faded gray question mark that links to /about.
 * These are TWO SEPARATE links (not nested) to avoid invalid nested-<a> HTML.
 *
 * NOTE: not rendered on article pages — there the wordmark sits under the
 * cover image instead (see ArticleView).
 */
export function Masthead({ siteName }: { siteName: string }) {
  const hasPeriod = siteName.endsWith('.')
  const base = hasPeriod ? siteName.slice(0, -1) : siteName

  return (
    <header className="masthead-header">
      <h1 className="masthead-title">
        <Link href="/" title={siteName} className="masthead-base-link">
          {base}
        </Link>
        {hasPeriod ? (
          <span className="masthead-period">
            {/* The question mark sits behind the real period — only its
                curve shows above, its dot tucked under the real period. */}
            <Link
              href={navPath('about')}
              title="About"
              className="masthead-question"
              aria-label="About"
            >
              ?
            </Link>
            <span className="masthead-period-dot">.</span>
          </span>
        ) : null}
      </h1>
    </header>
  )
}
