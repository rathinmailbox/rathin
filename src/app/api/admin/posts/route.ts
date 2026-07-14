import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { slugify, uniqueSlug } from '@/lib/site'
import type { Post } from '@/lib/types'

/** Serialize a Prisma Post row into the Post interface (dates as ISO strings). */
function toPost(row: {
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
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.coverImage,
    author: row.author,
    category: row.category,
    tags: row.tags,
    published: row.published,
    featured: row.featured,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** GET /api/admin/posts — list all posts, newest first. */
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
  })
  const posts: Post[] = rows.map(toPost)
  return NextResponse.json({ posts })
}

/** POST /api/admin/posts — create a new post. */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const slug = await uniqueSlug(slugify(title))

  // Optional published-at date (yyyy-mm-dd from the editor). If provided,
  // store it as a Date; otherwise let the DB default to now().
  const publishedAtRaw = typeof body.publishedAt === 'string' ? body.publishedAt : ''
  const publishedAt =
    publishedAtRaw && !Number.isNaN(new Date(publishedAtRaw).getTime())
      ? new Date(publishedAtRaw)
      : undefined

  const row = await db.post.create({
    data: {
      title,
      slug,
      excerpt: typeof body.excerpt === 'string' ? body.excerpt : null,
      content: typeof body.content === 'string' ? body.content : '',
      coverImage: typeof body.coverImage === 'string' ? body.coverImage : null,
      author: typeof body.author === 'string' && body.author ? body.author : 'Staff',
      category: typeof body.category === 'string' && body.category ? body.category : 'General',
      tags: typeof body.tags === 'string' ? body.tags : '',
      published: typeof body.published === 'boolean' ? body.published : false,
      featured: typeof body.featured === 'boolean' ? body.featured : false,
      ...(publishedAt ? { createdAt: publishedAt, updatedAt: publishedAt } : {}),
    },
  })

  return NextResponse.json({ post: toPost(row) }, { status: 201 })
}
