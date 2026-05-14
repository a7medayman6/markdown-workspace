export function extractOutlineFromMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/)
  const headings: { depth: number; text: string; slug: string; line: number }[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^(#{1,6})\s+(.*)$/)
    if (m) {
      const depth = m[1].length
      const text = m[2].trim()
      const slug = text.toLowerCase().replace(/[^a-z0-9\- ]/g, '').replace(/\s+/g, '-')
      headings.push({ depth, text, slug, line: i + 1 })
    }
  }
  return headings
}
