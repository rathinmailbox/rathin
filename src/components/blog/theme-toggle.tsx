'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

/**
 * ThemeToggle — a small fixed button in the top-right corner that toggles
 * between light and dark mode. Rendered only on public pages (not admin).
 * Uses next-themes. Avoids hydration mismatch by rendering a placeholder
 * until mounted.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Mark as mounted on the client after first render so the icon matches
  // the actual theme (avoids hydration mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="fixed right-3 top-3 z-50 flex size-9 items-center justify-center rounded-full border border-black/10 bg-background/80 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent dark:border-white/10"
    >
      {mounted ? (
        isDark ? <Sun className="size-4" /> : <Moon className="size-4" />
      ) : (
        <span className="size-4" />
      )}
    </button>
  )
}
