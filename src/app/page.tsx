import { db } from '@/lib/db'
import { getSettings } from '@/lib/site'
import { Shell } from '@/components/blog/shell'
import { HomeView } from '@/components/blog/home-view'
import { ArticleView } from '@/components/blog/article-view'
import { AboutView } from '@/components/blog/about-view'
import AdminApp from '@/components/admin/admin-app'
import type { Post, View } from '@/lib/types'
import Link from 'next/link'

/** Serialize a Prisma post row to the client-safe Post type (ISO dates). */
function toPost(p: {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  author: string
  category: string
  tags: string
  published: boolean
  featured: boolean
  createdAt: Date
  updatedAt: Date
}): Post {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

const VALID_VIEWS: View[] = ['home', 'article', 'about', 'admin']

function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <p className="font-serif text-6xl font-bold text-[var(--brand)]">404</p>
      <h1 className="mt-4 font-serif text-2xl font-bold">We couldn't find that page</h1>
      <p className="mt-2 text-muted-foreground">
        The story may have been moved or never existed.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Back to homepage
      </Link>
    </div>
  )
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; slug?: string }>
}) {
  const sp = await searchParams
  const rawView = sp.p
  const view: View = VALID_VIEWS.includes(rawView as View)
    ? (rawView as View)
    : 'home'
  const slug = sp.slug
  const settings = await getSettings()

  let content: React.ReactNode

  if (view === 'admin') {
    content = <AdminApp />
  } else if (view === 'about') {
    content = <AboutView aboutMarkdown={settings.about} />
  } else if (view === 'article' && slug) {
    const post = await db.post.findFirst({
      where: { slug, published: true },
    })
    content = post ? (
      <ArticleView post={toPost(post)} siteName={settings.siteName} />
    ) : (
      <NotFound />
    )
  } else {
    const posts = await db.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    })
    content = <HomeView posts={posts.map(toPost)} />
  }

  return (
    <Shell settings={settings} view={view} slug={slug}>
      {content}
    </Shell>
  )
}
