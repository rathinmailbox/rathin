'use client'

import * as React from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * MarkdownView — renders GitHub-flavored markdown inside a styled
 * `.prose-article` wrapper. External links open in a new tab, and
 * images lazy-load. Empty content renders a muted placeholder.
 */
const components: Components = {
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  img: ({ alt, ...props }) => (
    <img alt={alt ?? ''} loading="lazy" {...props} />
  ),
}

export function MarkdownView({ content }: { content: string }) {
  if (!content || !content.trim()) {
    return <p className="text-sm text-muted-foreground">No content.</p>
  }

  return (
    <div className="prose-article">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
