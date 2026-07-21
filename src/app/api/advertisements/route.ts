import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

/**
 * GET /api/advertisements — public list of enabled ads.
 *
 * Query params:
 *   placement = "home" | "inline"  (default: "home")
 *   postId    = post id            (only meaningful for inline)
 *
 * Always filters to enabled=true, ordered by `order` then createdAt.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const placementParam = searchParams.get('placement') ?? 'home'
  const placement = placementParam === 'inline' ? 'inline' : 'home'
  const postId = searchParams.get('postId') ?? undefined

  const rows = await db.advertisement.findMany({
    where: {
      enabled: true,
      placement,
      ...(placement === 'inline' && postId ? { postId } : {}),
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })

  const ads: Advertisement[] = rows.map(toAd)
  return NextResponse.json({ ads })
}
