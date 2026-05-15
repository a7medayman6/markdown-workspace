import React, { useEffect, useState } from 'react'
import { extractOutlineFromMarkdown } from '@/lib/outline'

export default function Outline({ filePath }: { filePath: string | null }) {
  const [outline, setOutline] = useState<{ depth: number; text: string; slug: string }[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!filePath) return setOutline([])
      const txt = await window.api.readFile(filePath)
      const o = extractOutlineFromMarkdown(txt).map((h) => ({ depth: h.depth, text: h.text, slug: h.slug }))
      if (mounted) setOutline(o)
    }
    load()
    return () => { mounted = false }
  }, [filePath])

  if (!filePath || outline.length === 0) return null

  function scrollToHeading(slug: string) {
    const preview = document.querySelector<HTMLElement>('.preview')
    const target = preview?.querySelector<HTMLElement>(`#${CSS.escape(slug)}`)
    if (!preview || !target) return

    preview.scrollTo({
      top: Math.max(target.offsetTop - 24, 0),
      behavior: 'smooth'
    })
  }

  return (
    <div className="outline">
      <div className="outline-header">Outline</div>
      <nav className="outline-list">
        {outline.map((h, i) => (
          <button
            key={i}
            className={`outline-item outline-h${h.depth}`}
            style={{ paddingLeft: 12 + (h.depth - 1) * 14 }}
            onClick={() => scrollToHeading(h.slug)}
            title={h.text}
          >
            {h.text}
          </button>
        ))}
      </nav>
    </div>
  )
}
