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

/** GET /api/admin/advertisements — list all ads, ordered by `order` then date. */
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db.advertisement.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
  const ads: Advertisement[] = rows.map(toAd)
  return NextResponse.json({ ads })
}

/** POST /api/admin/advertisements — create a new ad. */
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

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'Ad text is required' }, { status: 400 })
  }

  const placement = body.placement === 'inline' ? 'inline' : 'home'
  const postId =
    placement === 'inline' && typeof body.postId === 'string' && body.postId
      ? body.postId
      : null

  // Validate that the referenced post exists before binding.
  if (postId) {
    const post = await db.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Referenced post not found' }, { status: 400 })
    }
  }

  const linkRaw = typeof body.link === 'string' ? body.link.trim() : ''
  const link = linkRaw ? linkRaw : null

  const speed =
    typeof body.speed === 'number' && Number.isFinite(body.speed) && body.speed > 0
      ? Math.round(body.speed)
      : 20

  const row = await db.advertisement.create({
    data: {
      text,
      link,
      bgColor: typeof body.bgColor === 'string' && body.bgColor ? body.bgColor : '#ff0000',
      textColor: typeof body.textColor === 'string' && body.textColor ? body.textColor : '#ffffff',
      speed,
      placement,
      postId,
      paragraphNum:
        placement === 'inline' && typeof body.paragraphNum === 'number'
          ? Math.max(0, Math.round(body.paragraphNum))
          : null,
      enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
      order: typeof body.order === 'number' ? Math.round(body.order) : 0,
    },
  })

  return NextResponse.json({ ad: toAd(row) }, { status: 201 })
}
