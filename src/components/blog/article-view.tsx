import Link from 'next/link'
import { format } from 'date-fns'

import type { Post } from '@/lib/types'
import { navPath } from '@/lib/nav'
import { parseTags, stripLeadingH1 } from '@/lib/site'
import { ArticleBody } from '@/components/blog/article-body'
import { ArticleTopAd } from '@/components/blog/article-top-ad'

/**
 * ArticleView — Gawker-style article page.
 *
 * Two hero variants:
 *  - With cover image: a full-viewport hero (wordmark at top, image left +
 *    title right). This is the original treatment.
 *  - Without cover image: a compact, non-fullscreen centered typographic
 *    hero — wordmark on top, then the title and subtitle centered and
 *    relatively large (not absurd), with generous breathing room beneath
 *    the wordmark, and the tags row at the very top of the hero.
 *
 * Tags are shown at the TOP of the hero for BOTH variants. The
 * top-of-article inline ad (paragraphNum = 0) renders as a sibling BETWEEN
 * the hero and the body via <ArticleTopAd>, so it sits flush against the
 * bottom of the hero with zero gap. Mid-article ads stay inside the body.
 */
export function ArticleView({ post, siteName }: { post: Post; siteName: string }) {
  const tags = parseTags(post.tags)
  const dateLabel = format(new Date(post.createdAt), 'MMM d, yyyy')
  const body = stripLeadingH1(post.content)
  const hasCover = Boolean(post.coverImage)

  return (
    <article>
      {hasCover ? (
        /* ---- Full-screen hero: wordmark at top, image + title below ---- */
        <section className="article-hero">
          <h2 className="article-wordmark-top">
            <Link href={navPath('home')} title={siteName}>
              {siteName}
            </Link>
          </h2>

          {tags.length > 0 ? (
            <div className="article-hero-tags">
              {tags.map((tag) => (
                <span key={tag} className="article-tag">#{tag}</span>
              ))}
            </div>
          ) : null}

          <div className="article-hero-content">
            <div className="article-cover-col">
              <img src={post.coverImage as string} alt={post.title} loading="lazy" />
            </div>

            <div className="article-title-block">
              <h1 className="article-h1">{post.title}</h1>
              {post.excerpt ? <p className="article-dek">{post.excerpt}</p> : null}
              <div className="article-byline-grid">
                <div>
                  <span className="byline-label">By</span>
                  {post.author}
                </div>
                <div>
                  <span className="byline-label">Filed under</span>
                  {post.category}
                </div>
                <div>
                  <span className="byline-label">Published</span>
                  <time dateTime={post.createdAt}>{dateLabel}</time>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ---- Compact centered typographic hero (no cover image) ----
            Wordmark on top, generous padding, then centered kicker, a
            relatively large title, the subtitle, a byline row, and the tags
            at the very top. Not full-screen — sized to its content. */
        <section className="article-hero article-hero-text">
          <h2 className="article-wordmark-top">
            <Link href={navPath('home')} title={siteName}>
              {siteName}
            </Link>
          </h2>

          {tags.length > 0 ? (
            <div className="article-hero-tags article-hero-tags--center">
              {tags.map((tag) => (
                <span key={tag} className="article-tag">#{tag}</span>
              ))}
            </div>
          ) : null}

          <div className="article-hero-text-content">
            <p className="article-kicker">{post.category}</p>
            <h1 className="article-h1-display">{post.title}</h1>
            {post.excerpt ? <p className="article-dek">{post.excerpt}</p> : null}
            <div className="article-byline-row">
              <span>
                <span className="byline-label">By</span> {post.author}
              </span>
              <span className="byline-sep">·</span>
              <span>
                <span className="byline-label">Filed under</span> {post.category}
              </span>
              <span className="byline-sep">·</span>
              <time dateTime={post.createdAt}>{dateLabel}</time>
            </div>
          </div>
        </section>
      )}

      {/* Top-of-article ad, flush against the hero. Renders nothing if absent. */}
      <ArticleTopAd postId={post.id} />

      {/* ---- Body (Georgia serif) ---- */}
      <div className="article-body">
        <ArticleBody postId={post.id} content={body} />
      </div>
    </article>
  )
}
