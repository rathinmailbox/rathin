'use client'

import { useEffect, useState } from 'react'

import type { Advertisement } from '@/lib/types'
import { MarqueeAd } from './marquee-ad'

/**
 * ArticleTopAd — renders the inline ad(s) targeted at `paragraphNum = 0`
 * (the top of the article body) as a full-bleed strip.
 *
 * Unlike the mid-article ads (which live inside `.article-body` and inherit
 * its padding), this is placed by ArticleView as a SIBLING between the hero
 * and the body, so it butts flush against the bottom of the hero with zero
 * gap. Renders nothing when there are no top ads, leaving the layout
 * unchanged.
 */
export function ArticleTopAd({ postId }: { postId: string }) {
  const [ads, setAds] = useState<Advertisement[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(
          `/api/advertisements?placement=inline&postId=${encodeURIComponent(postId)}`,
          { cache: 'no-store' },
        )
        if (!res.ok) throw new Error('top ad fetch failed')
        const data = (await res.json()) as { ads: Advertisement[] }
        if (!cancelled) {
          // Only the ads targeted at the very top of the body.
          setAds(data.ads.filter((ad) => (ad.paragraphNum ?? -1) === 0))
        }
      } catch {
        if (!cancelled) setAds([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [postId])

  if (!ads || ads.length === 0) return null

  return (
    <div className="article-top-ad">
      {ads.map((ad) => (
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
  )
}
