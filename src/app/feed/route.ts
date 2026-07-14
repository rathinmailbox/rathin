import { db } from '@/lib/db'
import { getSettings } from '@/lib/site'

/**
 * RSS 2.0 feed for the site. Served at /feed with the correct
 * application/rss+xml content type so RSS readers can subscribe.
 *
 * Generates an <rss><channel> with one <item> per published post (newest
 * first). Each item links to /article/{slug}.
 */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Strip markdown to plain text for the feed description. */
function toPlainText(md: string): string {
  return md
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[.*?\]\(.+?\)/g, '')
    .replace(/>\s+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function GET() {
  const settings = await getSettings()
  const siteUrl = 'https://rathin.blog'

  const posts = await db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const items = posts
    .map((p) => {
      const link = `${siteUrl}/article/${p.slug}`
      const description = p.excerpt
        ? escapeXml(p.excerpt)
        : escapeXml(toPlainText(p.content).slice(0, 300))
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <category>${escapeXml(p.category)}</category>
      <author>${escapeXml(p.author)}</author>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
    </item>`
    })
    .join('\n')

  const lastBuild = posts[0]
    ? new Date(posts[0].createdAt).toUTCString()
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(settings.tagline)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${siteUrl}/feed" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate',
    },
  })
}
