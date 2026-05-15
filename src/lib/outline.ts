export function slugifyHeading(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-')
}

export function createHeadingSlugger() {
  const seen = new Map<string, number>()

  return (text: string) => {
    const base = slugifyHeading(text) || 'section'
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}

function cleanHeadingText(text: string) {
  return text
    .replace(/\\([\\`*_[\]{}()#+\-.!])/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

export function extractOutlineFromMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/)
  const headings: { depth: number; text: string; slug: string; line: number }[] = []
  const slug = createHeadingSlugger()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^(#{1,6})\s+(.*)$/)
    if (m) {
      const depth = m[1].length
      const text = cleanHeadingText(m[2].replace(/\s+#+\s*$/, ''))
      headings.push({ depth, text, slug: slug(text), line: i + 1 })
    }
  }
  return headings
}
