'use client'

import { useEffect, useState } from 'react'

import type { Advertisement } from '@/lib/types'
import { MarqueeAd } from './marquee-ad'

interface HomeAdsProps {
  /**
   * Which homepage slot to fill.
   *  - 'home'     (default): stacked at the bottom of the page
   *  - 'home-top': stacked right below the masthead logo
   */
  placement?: 'home' | 'home-top'
}

/**
 * HomeAds — fetches enabled homepage ads for the given slot and stacks them
 * vertically.
 *
 * Renders nothing (not even a wrapper) when there are no ads, so the page
 * looks unchanged when the feature isn't in use.
 */
export function HomeAds({ placement = 'home' }: HomeAdsProps = {}) {
  const [ads, setAds] = useState<Advertisement[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/advertisements?placement=${placement}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('ad fetch failed')
        const data = (await res.json()) as { ads: Advertisement[] }
        if (!cancelled) setAds(data.ads)
      } catch {
        if (!cancelled) setAds([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [placement])

  if (!ads || ads.length === 0) return null

  return (
    <div className="home-ads">
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
