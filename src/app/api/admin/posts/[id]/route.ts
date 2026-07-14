import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { uniqueSlug, slugify } from '@/lib/site'
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

/** GET /api/admin/posts/[id] — fetch a single post. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const row = await db.post.findUnique({ where: { id } })
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ post: toPost(row) })
}

/** PUT /api/admin/posts/[id] — update a post. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await db.post.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (typeof body.title === 'string') data.title = body.title
  if (typeof body.excerpt === 'string') data.excerpt = body.excerpt
  if (typeof body.content === 'string') data.content = body.content
  if (typeof body.coverImage === 'string') data.coverImage = body.coverImage
  if (typeof body.author === 'string') data.author = body.author
  if (typeof body.category === 'string') data.category = body.category
  if (typeof body.tags === 'string') data.tags = body.tags
  if (typeof body.published === 'boolean') data.published = body.published
  if (typeof body.featured === 'boolean') data.featured = body.featured

  // Optional published-at date (yyyy-mm-dd). null clears it back to now.
  if (body.publishedAt !== undefined) {
    const raw = typeof body.publishedAt === 'string' ? body.publishedAt : ''
    if (raw && !Number.isNaN(new Date(raw).getTime())) {
      const d = new Date(raw)
      data.createdAt = d
      data.updatedAt = d
    }
  }

  // Only update the slug if one is explicitly provided.
  if (typeof body.slug === 'string' && body.slug.trim()) {
    data.slug = await uniqueSlug(slugify(body.slug), id)
  }

  const row = await db.post.update({ where: { id }, data })
  return NextResponse.json({ post: toPost(row) })
}

/** DELETE /api/admin/posts/[id] — delete a post. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await db.post.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
