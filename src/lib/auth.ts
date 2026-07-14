import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'dispatch_admin'

/**
 * Admin password. Set ADMIN_PASSWORD in your environment (.env) to change it.
 * Defaults to "admin123" for first-time use — change it after first login.
 */
export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123'
}

/** A server secret used to sign the session cookie. */
function getSecret(): string {
  return process.env.ADMIN_SECRET || 'dispatch-default-secret-change-me'
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

/** Build the signed session token. */
function buildToken(): string {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
  const payload = `admin:${expires}`
  return `${payload}.${sign(payload)}`
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

/** Set a session cookie on a NextResponse (for login). Returns the response. */
export function setSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, buildToken(), COOKIE_OPTS)
  return res
}

/** Clear the session cookie on a NextResponse (for logout). Returns the response. */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, '', { ...COOKIE_OPTS, maxAge: 0 })
  return res
}

/** Verify the current request is from an authenticated admin. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  const expected = sign(payload)
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return false
    }
  } catch {
    return false
  }
  const [, expiresStr] = payload.split(':')
  const expires = Number(expiresStr)
  if (!expires || expires < Math.floor(Date.now() / 1000)) return false
  return true
}

/** Throw a 401 if the request is not authenticated. */
export async function requireAdmin() {
  if (!(await isAuthenticated())) {
    throw new Error('Unauthorized')
  }
}
