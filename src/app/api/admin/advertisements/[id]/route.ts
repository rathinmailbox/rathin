import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import type { Advertisement } from '@/lib/types'

/** Serialize a Prisma Advertisement row into the Advertisement interface. */
function toAd(row: {
  id: string
  text: string
  link: string | null
  bgColor: string
  textColor: string
  speed: number
  placement: string
  postId: string | null
  paragraphNum: number | null
  enabled: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}): Advertisement {
  return {
    id: row.id,
    text: row.text,
    link: row.link,
    bgColor: row.bgColor,
    textColor: row.textColor,
    speed: row.speed,
    placement: row.placement === 'inline' ? 'inline' : 'home',
    postId: row.postId,
    paragraphNum: row.paragraphNum,
    enabled: row.enabled,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** GET /api/admin/advertisements/[id] — fetch a single ad. */
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
  const row = await db.advertisement.findUnique({ where: { id } })
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ ad: toAd(row) })
}

/** PUT /api/admin/advertisements/[id] — update an ad. */
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
  const existing = await db.advertisement.findUnique({ where: { id } })
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

  if (typeof body.text === 'string') {
    const t = body.text.trim()
    if (!t) {
      return NextResponse.json({ error: 'Ad text cannot be empty' }, { status: 400 })
    }
    data.text = t
  }

  if (body.link !== undefined) {
    const raw = typeof body.link === 'string' ? body.link.trim() : ''
    data.link = raw ? raw : null
  }
  if (typeof body.bgColor === 'string' && body.bgColor) data.bgColor = body.bgColor
  if (typeof body.textColor === 'string' && body.textColor) data.textColor = body.textColor
  if (typeof body.speed === 'number' && body.speed > 0) data.speed = Math.round(body.speed)
  if (typeof body.enabled === 'boolean') data.enabled = body.enabled
  if (typeof body.order === 'number') data.order = Math.round(body.order)

  // Placement changes also drive postId / paragraphNum.
  if (typeof body.placement === 'string') {
    const placement = body.placement === 'inline' ? 'inline' : 'home'
    data.placement = placement

    if (placement === 'inline') {
      if (typeof body.postId === 'string' && body.postId) {
        const post = await db.post.findUnique({ where: { id: body.postId } })
        if (!post) {
          return NextResponse.json({ error: 'Referenced post not found' }, { status: 400 })
        }
        data.postId = body.postId
      }
      if (typeof body.paragraphNum === 'number') {
        data.paragraphNum = Math.max(0, Math.round(body.paragraphNum))
      }
    } else {
      // Moving to home clears inline-only fields.
      data.postId = null
      data.paragraphNum = null
    }
  } else if (existing.placement === 'inline') {
    // Still inline — allow updating postId / paragraphNum directly.
    if (typeof body.postId === 'string' && body.postId) {
      const post = await db.post.findUnique({ where: { id: body.postId } })
      if (!post) {
        return NextResponse.json({ error: 'Referenced post not found' }, { status: 400 })
      }
      data.postId = body.postId
    }
    if (typeof body.paragraphNum === 'number') {
      data.paragraphNum = Math.max(0, Math.round(body.paragraphNum))
    }
  }

  const row = await db.advertisement.update({ where: { id }, data })
  return NextResponse.json({ ad: toAd(row) })
}

/** DELETE /api/admin/advertisements/[id] — delete an ad. */
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
  const existing = await db.advertisement.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.advertisement.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
