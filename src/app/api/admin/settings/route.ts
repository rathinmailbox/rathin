import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getSettings, invalidateSettings } from '@/lib/site'
import { db } from '@/lib/db'
import type { SiteSettings } from '@/lib/types'

/** GET /api/admin/settings — return current site settings. */
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings: SiteSettings = await getSettings()
  return NextResponse.json({ settings })
}

/** PUT /api/admin/settings — update site settings (upsert the "default" row). */
export async function PUT(req: NextRequest) {
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

  const siteName = typeof body.siteName === 'string' ? body.siteName : ''
  const tagline = typeof body.tagline === 'string' ? body.tagline : ''
  const about = typeof body.about === 'string' ? body.about : ''
  const accent = typeof body.accent === 'string' ? body.accent : ''

  if (!siteName || !tagline || !about || !accent) {
    return NextResponse.json(
      { error: 'siteName, tagline, about, and accent are all required' },
      { status: 400 },
    )
  }

  await db.siteSetting.upsert({
    where: { id: 'default' },
    update: { siteName, tagline, about, accent },
    create: { id: 'default', siteName, tagline, about, accent },
  })

  invalidateSettings()
  const settings: SiteSettings = await getSettings()
  return NextResponse.json({ settings })
}
