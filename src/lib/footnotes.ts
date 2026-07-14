/**
 * Footnote pre-processor — converts an inline `[[note text]]` syntax into
 * Tufte CSS sidenote HTML (`<label>` + `<input>` + `<span class="sidenote">`).
 *
 * On wide screens the sidenote floats into the right margin. On narrow
 * screens it's hidden until the reader clicks the superscript number,
 * which toggles the hidden checkbox and reveals the note inline.
 *
 * The `[[...]]` syntax was chosen because it doesn't conflict with any
 * standard markdown construct and is easy to type in the admin editor.
 *
 * IMPORTANT: The MDXEditor's remark parser escapes `[[` to `\[\[` when
 * round-tripping (loading + saving). This means edited posts may have
 * `\[\[note text]]` instead of `[[note text]]`. This function handles
 * BOTH forms by first unescaping `\[\[` → `[[` before processing.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Unescape the bracket-escaping that remark/MDXEditor adds when round-tripping.
 * `\[\[` → `[[` and `\]\]` → `]]`. Also handles single `\[` → `[`.
 * This fixes footnotes in posts that were edited through the admin panel.
 */
function unescapeMarkdownBrackets(markdown: string): string {
  return markdown
    .replace(/\\\[\\\[/g, '[[')
    .replace(/\\\]\\\]/g, ']]')
}

/**
 * Replace every `[[note text]]` in the markdown with Tufte sidenote HTML.
 * Also handles the escaped `\[\[note text]]` form produced by MDXEditor.
 * Returns the processed markdown string (safe to pass to react-markdown
 * with rehype-raw).
 */
export function processFootnotes(markdown: string): string {
  if (!markdown) return markdown
  // Unescape any MDXEditor-mangled brackets first.
  const unescaped = unescapeMarkdownBrackets(markdown)
  let counter = 0
  // Match [[ ... ]] — non-greedy, allow newlines, at least one char inside.
  return unescaped.replace(/\[\[([\s\S]+?)\]\]/g, (_full, inner: string) => {
    counter++
    const id = `sn-${counter}`
    const text = escapeHtml(inner.trim())
    return (
      `<label for="${id}" class="margin-toggle sidenote-number"></label>` +
      `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
      `<span class="sidenote">${text}</span>`
    )
  })
}

/** Count how many footnote references exist in the markdown. */
export function countFootnotes(markdown: string): number {
  if (!markdown) return 0
  const unescaped = unescapeMarkdownBrackets(markdown)
  return (unescaped.match(/\[\[[\s\S]+?\]\]/g) || []).length
}
