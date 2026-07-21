'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * MarqueeAd — a horizontally scrolling banner (marquee).
 *
 * The text is repeated to fill at least the full container width, then the
 * whole run is duplicated once. The track translates from 0 to -50%, which
 * lands seamlessly at the start of the (identical) second half — so the
 * scroll looks infinite with no empty gaps, regardless of text length.
 *
 * Speed is the animation duration in seconds (lower = faster).
 *
 * Non-blocking: the track is `pointer-events: none` so it never intercepts
 * reading/scrolling; only the optional link is clickable. The animation
 * pauses under `prefers-reduced-motion`.
 */
export function MarqueeAd({
  text,
  link = null,
  bgColor = '#ff0000',
  textColor = '#ffffff',
  speed = 20,
  className = '',
}: {
  text: string
  link?: string | null
  bgColor?: string
  textColor?: string
  speed?: number
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const firstItemRef = useRef<HTMLSpanElement>(null)
  // Number of copies per half. Two halves make the seamless loop.
  const [copiesPerHalf, setCopiesPerHalf] = useState(4)

  // Measure how many copies are needed to overflow the container, so the
  // scrolling track is always full of text (no empty stretches). Re-runs on
  // resize and when the text changes (also picks up late font loads via the
  // ResizeObserver on the item itself).
  useEffect(() => {
    if (!text) return
    const container = containerRef.current
    const firstItem = firstItemRef.current
    if (!container || !firstItem) return

    const recompute = () => {
      const containerWidth = container.offsetWidth
      const itemWidth = firstItem.offsetWidth // one copy (text + separator)
      if (itemWidth <= 0 || containerWidth <= 0) return
      const needed = Math.ceil(containerWidth / itemWidth) + 1
      setCopiesPerHalf(Math.max(1, needed))
    }

    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(container)
    ro.observe(firstItem)
    return () => ro.disconnect()
  }, [text])

  if (!text) return null

  const totalCopies = copiesPerHalf * 2
  const items = Array.from({ length: totalCopies }, (_, i) => (
    <span
      key={i}
      ref={i === 0 ? firstItemRef : undefined}
      className="marquee-ad__item"
      aria-hidden="true"
    >
      {text}
      <span className="marquee-ad__sep" aria-hidden="true">
        {'\u00A0\u00A0\u2022\u00A0\u00A0'}
      </span>
    </span>
  ))

  const track = (
    <div
      className={`marquee-ad__track ${className}`}
      style={{ animationDuration: `${Math.max(2, speed)}s` }}
    >
      {items}
    </div>
  )

  return (
    <div
      ref={containerRef}
      className="marquee-ad"
      role="marquee"
      aria-label={text}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="marquee-ad__link"
          aria-label={text}
        >
          {track}
        </a>
      ) : (
        track
      )}
    </div>
  )
}
