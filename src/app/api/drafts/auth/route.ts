import { NextRequest, NextResponse } from 'next/server'
import {
  isDraftsAuthenticated,
  verifyDraftsPassword,
  setDraftsSessionCookie,
  clearDraftsSessionCookie,
} from '@/lib/drafts-auth'

export async function GET() {
  const authenticated = await isDraftsAuthenticated()
  return NextResponse.json({ authenticated })
}

export async function POST(req: NextRequest) {
  let body: { password?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
  }

  const password = typeof body.password === 'string' ? body.password : ''
  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  if (verifyDraftsPassword(password)) {
    return setDraftsSessionCookie(NextResponse.json({ ok: true }))
  }

  return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
}

export async function DELETE() {
  return clearDraftsSessionCookie(NextResponse.json({ ok: true, message: 'Logged out' }))
}
