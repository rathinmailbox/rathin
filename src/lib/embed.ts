export function expandEmbedBlocks(markdown: string): string {
  return markdown.replace(/:::embed\s*\n([\s\S]*?)\n:::/g, (_match, inner) => inner.trim())
}
