'use client'

import { useEffect, useState } from 'react'

import type { Advertisement } from '@/lib/types'
import { ArticleMarkdown } from './article-markdown'
import { MarqueeAd } from './marquee-ad'

/**
 * ArticleBody — renders the article markdown and inserts inline scrolling ads
 * after chosen paragraph positions.
 *
 * Inline ads are fetched for this specific post. The body is split into
 * paragraph blocks on blank lines (≥2 newlines), rendered as separate
 * `<ArticleMarkdown>` blocks. After the 1-based paragraph whose index equals
 * an ad's `paragraphNum`, the ad is inserted. `paragraphNum = 0` (top of
 * body) is handled separately by <ArticleTopAd>, rendered as a sibling of
 * the hero so it sits flush against it — NOT here.
 *
 * Ads are non-blocking: the marquee track is `pointer-events: none`, so it
 * never interferes with reading or selection.
 */
export function ArticleBody({ postId, content }: { postId: string; content: string }) {
  const [ads, setAds] = useState<Advertisement[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(
          `/api/advertisements?placement=inline&postId=${encodeURIComponent(postId)}`,
          { cache: 'no-store' },
        )
        if (!res.ok) throw new Error('inline ad fetch failed')
        const data = (await res.json()) as { ads: Advertisement[] }
        if (!cancelled) setAds(data.ads)
      } catch {
        if (!cancelled) setAds([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [postId])

  // Split the body into paragraph blocks on blank-line separators.
  const blocks = content
    ? content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
    : []

  // Group ads by their target paragraph number for quick lookup.
  // NOTE: paragraphNum = 0 (top of body) is rendered by <ArticleTopAd> as a
  // sibling of the hero, so we skip it here and only keep paragraph ads.
  const adsByPosition = new Map<number, Advertisement[]>()
  for (const ad of ads) {
    const pos = ad.paragraphNum ?? -1
    if (pos <= 0) continue
    const list = adsByPosition.get(pos)
    if (list) list.push(ad)
    else adsByPosition.set(pos, [ad])
  }

  return (
    // NOTE: each <ArticleMarkdown> wraps its own .prose-article internally,
    // so we keep this outer container plain. That lets the inline ads break
    // out to full viewport width (see .inline-ad-fullbleed in globals.css),
    // since their containing block is the centered .article-body rather than
    // the narrower, left-aligned .prose-article column.
    <div className="article-body-content">
      {blocks.map((block, i) => {
        const paragraphNumber = i + 1 // 1-based
        const afterAds = adsByPosition.get(paragraphNumber) ?? []
        return (
          <div key={`block-${i}`} className="article-body-block">
            <ArticleMarkdown content={block} />
            {afterAds.length > 0 ? (
              <div className="inline-ad-fullbleed">
                {afterAds.map((ad) => (
                  <MarqueeAd
                    key={ad.id}
                    text={ad.text}
                    link={ad.link}
                    bgColor={ad.bgColor}
                    textColor={ad.textColor}
                    speed={ad.speed}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
