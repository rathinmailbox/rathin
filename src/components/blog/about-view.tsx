import { stripLeadingH1 } from '@/lib/site'
import { MarkdownView } from '@/components/blog/markdown-view'

/**
 * AboutView — a simple centered about page in the Gawker style: a giant
 * serif "About" title, a thin accent rule, then the editable markdown body.
 */
export function AboutView({ aboutMarkdown }: { aboutMarkdown: string }) {
  const body = stripLeadingH1(aboutMarkdown)
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <header className="flex flex-col items-center text-center">
        <h1
          className="masthead-title"
          style={{ fontSize: 'clamp(4rem, 16vw, 10rem)', paddingTop: 0 }}
        >
          About
        </h1>
        <div className="mt-1 h-[2px] w-16 bg-[var(--brand)]" />
      </header>

      <div className="mt-10">
        <MarkdownView content={body} />
      </div>
    </div>
  )
}
