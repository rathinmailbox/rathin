import { NextRequest, NextResponse } from 'next/server'
import { isDraftsAuthenticated } from '@/lib/drafts-auth'
import { getDraftsContent, saveDraftsContent } from '@/lib/drafts-db'

export async function GET() {
  const data = await getDraftsContent()
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const authenticated = await isDraftsAuthenticated()
  if (!authenticated) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid password session required to edit drafts' },
      { status: 401 }
    )
  }

  let body: { content?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.content !== 'string') {
    return NextResponse.json({ error: 'Content must be a string' }, { status: 400 })
  }

  const result = await saveDraftsContent(body.content)
  return NextResponse.json({ ok: true, ...result })
}
