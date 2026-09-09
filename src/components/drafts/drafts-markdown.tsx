'use client'

import React, { useState } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { processFootnotes } from '@/lib/footnotes'
import { Check, Copy, Hash } from 'lucide-react'

interface DraftsMarkdownProps {
  content: string
}

function CodeBlock({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = useState(false)
  const isInline = !className && typeof children === 'string' && !children.includes('\n')

  if (isInline) {
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.88em] text-foreground border border-border/50" {...props}>
        {children}
      </code>
    )
  }

  const rawText = String(children).replace(/\n$/, '')

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-6 overflow-hidden rounded-xl border border-border/60 bg-neutral-950 text-neutral-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/90 text-xs font-mono text-neutral-400">
        <span>{className ? className.replace('language-', '') : 'snippet'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-[0.9rem] leading-relaxed font-mono">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function Heading2({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const [copied, setCopied] = useState(false)
  const textContent = React.Children.toArray(children).join('')
  const id = slugify(textContent)

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <h2
      id={id}
      className="group relative flex items-baseline gap-2 mt-12 mb-4 scroll-mt-24 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
      {...props}
    >
      <span>{children}</span>
      <button
        onClick={copyLink}
        type="button"
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-muted-foreground focus:opacity-100 inline-flex items-center p-1"
        title="Copy anchor link"
        aria-label="Copy anchor link"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Hash className="h-4 w-4" />
        )}
      </button>
    </h2>
  )
}

function CustomSeparator() {
  return (
    <div className="my-16 flex items-center justify-center gap-4 select-none" role="separator">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/80 to-border" />
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/60 bg-muted/40 text-xs font-mono text-muted-foreground uppercase tracking-widest shadow-xs">
        <span className="text-amber-600 dark:text-amber-400">✦</span>
        <span>Draft Separator</span>
        <span className="text-amber-600 dark:text-amber-400">✦</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/80 to-border" />
    </div>
  )
}

const markdownComponents: Components = {
  hr: () => <CustomSeparator />,
  h1: ({ children, ...props }) => (
    <h1
      className="mt-6 mb-4 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: Heading2,
  h3: ({ children, ...props }) => (
    <h3
      className="mt-8 mb-3 font-serif text-xl sm:text-2xl font-semibold text-foreground tracking-tight"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-4 leading-[1.8] text-foreground/90 font-sans text-[1.05rem]" {...props}>
      {children}
    </p>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-6 border-l-4 border-amber-600/70 dark:border-amber-500/70 bg-muted/30 pl-5 py-3 pr-4 rounded-r-lg font-serif italic text-[1.12rem] text-foreground/80 shadow-xs"
      {...props}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-4 list-disc pl-6 space-y-2 text-foreground/90 leading-relaxed" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-4 list-decimal pl-6 space-y-2 text-foreground/90 leading-relaxed" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => <li className="text-[1.02rem]" {...props}>{children}</li>,
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-amber-700 dark:text-amber-400 underline underline-offset-3 decoration-amber-500/40 hover:decoration-amber-500 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  table: ({ children, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border/80">
      <table className="w-full border-collapse text-left text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border-b border-border bg-muted/60 px-4 py-2.5 font-semibold text-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-b border-border/60 px-4 py-2 text-foreground/90" {...props}>
      {children}
    </td>
  ),
  label: (props) => <label {...props} />,
  input: (props) => <input {...props} />,
}

export function DraftsMarkdown({ content }: DraftsMarkdownProps) {
  if (!content || !content.trim()) {
    return (
      <div className="py-12 text-center text-muted-foreground font-mono text-sm">
        No drafts published yet.
      </div>
    )
  }

  const processed = processFootnotes(content)

  return (
    <div className="drafts-stream prose-drafts">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
