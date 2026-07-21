import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `image-${randomUUID()}`
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = path.extname(file.name) || '.png'
  const safeName = sanitizeFileName(path.basename(file.name, ext))
  const fileName = `${safeName}-${randomUUID()}${ext}`
  const targetPath = path.join(UPLOAD_DIR, fileName)

  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(targetPath, buffer)

  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0] ?? 'http'
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0] ?? req.headers.get('host') ?? 'localhost:3000'
  const url = new URL(`/uploads/${fileName}`, `${forwardedProto}://${forwardedHost}`).toString()
  return NextResponse.json({ url })
}
