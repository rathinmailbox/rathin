import { db } from '@/lib/db'

/** Cache settings in memory to avoid hitting the DB on every request. */
let cachedSettings: {
  siteName: string
  tagline: string
  about: string
  accent: string
} | null = null
let cacheTime = 0
const TTL = 1000 * 5 // 5s

export interface SiteSettings {
  siteName: string
  tagline: string
  about: string
  accent: string
}

const DEFAULTS: SiteSettings = {
  siteName: 'rathin.',
  tagline: 'Independent stories, sharp perspectives.',
  about:
    '# About\n\nWelcome to our publication. This text is editable from the admin panel — no code required.',
  accent: '#c1272d',
}

/** Read site settings from the DB (with a short memory cache). */
export async function getSettings(): Promise<SiteSettings> {
  if (cachedSettings && Date.now() - cacheTime < TTL) return cachedSettings
  try {
    const row = await db.siteSetting.findUnique({ where: { id: 'default' } })
    if (row) {
      cachedSettings = {
        siteName: row.siteName,
        tagline: row.tagline,
        about: row.about,
        accent: row.accent,
      }
    } else {
      cachedSettings = DEFAULTS
    }
  } catch {
    cachedSettings = DEFAULTS
  }
  cacheTime = Date.now()
  return cachedSettings!
}

/** Invalidate the settings cache (call after an update). */
export function invalidateSettings() {
  cachedSettings = null
  cacheTime = 0
}

/** Create a URL-friendly slug from a title. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Ensure a slug is unique by appending a short suffix if needed. */
export async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  let slug = base || 'post'
  let n = 2
  while (true) {
    const existing = await db.post.findFirst({
      where: { slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      select: { id: true },
    })
    if (!existing) return slug
    slug = `${base}-${n++}`
  }
}

/** Parse a comma-separated tags string into a clean array. */
export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

/**
 * Remove a leading level-1 heading from markdown.
 * The article/about views render their own title heading, so a duplicate `# Title`
 * at the top of the body would show the title twice. This strips it (first H1 only).
 */
export function stripLeadingH1(markdown: string): string {
  if (!markdown) return ''
  const trimmed = markdown.replace(/^\s+/, '')
  const match = trimmed.match(/^#\s+.+(\r?\n|$)/)
  if (!match) return markdown
  return markdown.replace(match[0], '').replace(/^\s+/, '')
}
