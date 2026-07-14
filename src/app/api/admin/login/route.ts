import { NextRequest, NextResponse } from 'next/server'
import { getAdminPassword, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  let body: { password?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const password = typeof body.password === 'string' ? body.password : ''
  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  if (password === getAdminPassword()) {
    // Set the session cookie directly on the response so the browser stores it.
    return setSessionCookie(NextResponse.json({ ok: true }))
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
