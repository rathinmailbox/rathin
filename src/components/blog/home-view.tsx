import Link from 'next/link'
import { format } from 'date-fns'

import type { Post } from '@/lib/types'
import { navPath } from '@/lib/nav'
import { HomeAds } from './home-ads'

/**
 * HomeView — a simple Gawker-style vertical list of the latest stories.
 * Each item: centered thumbnail, centered uppercase headline, short
 * subhead, and a meta row (category · author · date) in the accent color.
 * No featured hero, no grid, no menu bar.
 */
export function HomeView({ posts }: { posts: Post[] }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="font-serif text-2xl text-muted-foreground">
          No stories yet. Check back soon.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {posts.map((post) => (
          <Link key={post.id} href={navPath('article', { slug: post.slug })} className="news-item">
            {post.coverImage ? (
              <div className="news-thumb">
                <img src={post.coverImage} alt="" loading="lazy" />
              </div>
            ) : null}
            <p className="news-headline">{post.title}</p>
            {post.excerpt ? <p className="news-subhead">{post.excerpt}</p> : null}
            <div className="news-meta">
              <span>{post.category}</span>
              <span>By {post.author}</span>
              <time dateTime={post.createdAt}>{format(new Date(post.createdAt), 'MMM d, yyyy')}</time>
            </div>
          </Link>
        ))}
      </div>
      {/* Scrolling homepage ads stack vertically at the bottom. */}
      <HomeAds />
    </>
  )
}
