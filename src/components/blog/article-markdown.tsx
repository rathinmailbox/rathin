'use client'

import * as React from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { processFootnotes } from '@/lib/footnotes'

/**
 * ArticleMarkdown — renders article body markdown with Tufte CSS sidenotes.
 *
 * Inline `[[note text]]` tokens are converted to Tufte sidenote HTML
 * (label + checkbox + span.sidenote) by `processFootnotes`, then
 * `rehype-raw` renders that HTML so it appears inline in the text.
 *
 * On wide viewports the sidenotes float into the right margin. On narrow
 * viewports they're hidden until the reader clicks the superscript number.
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
  // Render the Tufte toggle elements as-is (rehype-raw already parsed them).
  label: (props) => <label {...props} />,
  input: (props) => <input {...props} />,
}

export function ArticleMarkdown({ content }: { content: string }) {
  if (!content || !content.trim()) {
    return <p className="text-sm text-muted-foreground">No content.</p>
  }

  const processed = processFootnotes(content)

  return (
    <div className="prose-article">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
