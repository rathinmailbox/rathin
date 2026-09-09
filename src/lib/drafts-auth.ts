import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getAdminPassword, isAuthenticated as isAdminAuthenticated } from './auth'

const COOKIE_NAME = 'drafts_session'

/**
 * Specific password for the drafts page.
 * Checks DRAFTS_PASSWORD first, then falls back to ADMIN_PASSWORD, then 'rathin-drafts'.
 */
export function getDraftsPassword(): string {
  return process.env.DRAFTS_PASSWORD || process.env.ADMIN_PASSWORD || 'rathin-drafts'
}

function getSecret(): string {
  return process.env.ADMIN_SECRET || 'rathin-drafts-secret-key-salt'
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

function buildToken(): string {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days
  const payload = `drafts:${expires}`
  return `${payload}.${sign(payload)}`
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
}

export function setDraftsSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, buildToken(), COOKIE_OPTS)
  return res
}

export function clearDraftsSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, '', { ...COOKIE_OPTS, maxAge: 0 })
  return res
}

export async function isDraftsAuthenticated(): Promise<boolean> {
  // If the user is already authenticated as site admin, grant drafts access as well
  if (await isAdminAuthenticated()) {
    return true
  }

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

export function verifyDraftsPassword(inputPassword: string): boolean {
  const draftsPass = getDraftsPassword()
  const adminPass = getAdminPassword()

  // Allow either the specific drafts password or the site admin password
  return inputPassword === draftsPass || inputPassword === adminPass
}
