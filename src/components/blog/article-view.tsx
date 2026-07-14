import Link from 'next/link'
import { format } from 'date-fns'
import { Newspaper } from 'lucide-react'

import type { Post } from '@/lib/types'
import { navPath } from '@/lib/nav'
import { parseTags, stripLeadingH1 } from '@/lib/site'
import { ArticleMarkdown } from '@/components/blog/article-markdown'

/**
 * ArticleView — Gawker-style article page.
 *
 * The hero fills the viewport: the site wordmark sits at the TOP, then
 * below it the cover image (left, inset, top-aligned) + title block
 * (right, right-aligned). The article body uses Georgia serif below.
 *
 * On mobile (portrait): wordmark at top, then cover image full-width,
 * then title/dek/byline stacked below.
 */
export function ArticleView({ post, siteName }: { post: Post; siteName: string }) {
  const tags = parseTags(post.tags)
  const dateLabel = format(new Date(post.createdAt), 'MMM d, yyyy')
  const body = stripLeadingH1(post.content)

  return (
    <article>
      {/* ---- Full-screen hero: wordmark at top, image + title below ---- */}
      <section className="article-hero">
        <h2 className="article-wordmark-top">
          <Link href={navPath('home')} title={siteName}>
            {siteName}
          </Link>
        </h2>

        <div className="article-hero-content">
          <div className="article-cover-col">
            {post.coverImage ? (
              <img src={post.coverImage} alt={post.title} loading="lazy" />
            ) : (
              <div className="article-cover-placeholder">
                <Newspaper className="size-12 text-black/30" aria-hidden />
              </div>
            )}
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

      {/* ---- Body (Georgia serif) ---- */}
      <div className="article-body">
        <ArticleMarkdown content={body} />

        {tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span style={{ fontFamily: 'var(--fontFamilySansSerif)' }} className="text-xs uppercase tracking-widest text-muted-foreground">
              Tags
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
