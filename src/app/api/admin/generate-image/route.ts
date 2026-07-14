import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

/** POST /api/admin/generate-image — generate a cover image from a prompt. */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { prompt?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  try {
    const zai = await ZAI.create()
    const res = await zai.images.generations.create({
      prompt,
      size: '1344x768',
    })
    const b64 = res.data[0].base64

    const coversDir = path.join(process.cwd(), 'public', 'covers')
    await fs.mkdir(coversDir, { recursive: true })

    const filename = `${Date.now()}.png`
    const filePath = path.join(coversDir, filename)
    await fs.writeFile(filePath, Buffer.from(b64, 'base64'))

    return NextResponse.json({ url: `/covers/${filename}` })
  } catch {
    return NextResponse.json(
      { error: 'Image generation failed' },
      { status: 500 },
    )
  }
}
