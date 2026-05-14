import React, { useState, useEffect } from 'react'

type Result = { file: string; line: number; preview: string }

type Props = { 
  files: string[]
  onPick: (f: string) => void
  isModal?: boolean
  onClose?: () => void
}

export default function Search({ files, onPick, isModal = false, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)

  const run = async (q: string) => {
    setQuery(q)
    setSelectedIdx(0)
    if (!q) return setResults([])
    const lower = q.toLowerCase()
    const out: Result[] = []
    for (const f of files) {
      try {
        const txt = await window.api.readFile(f)
        const lines = txt.split(/\r?\n/)
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i]
          if (l.toLowerCase().includes(lower)) {
            out.push({ file: f, line: i + 1, preview: l.trim().slice(0, 200) })
            if (out.length > 100) break
          }
        }
      } catch (err) {
        console.warn('Search read failed', err)
      }
    }
    setResults(out)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isModal) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        e.preventDefault()
        onPick(results[selectedIdx].file)
        onClose?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, selectedIdx, isModal, onPick, onClose])

  if (isModal) {
    return (
      <div className="search-modal-overlay" onClick={onClose}>
        <div className="search-modal" onClick={(e) => e.stopPropagation()}>
          <div className="search-input-wrapper">
            <input
              autoFocus
              className="search-input"
              placeholder="Search workspace..."
              value={query}
              onChange={(e) => run(e.target.value)}
            />
          </div>
          <div className="search-results-modal">
            {results.length === 0 && query ? (
              <div className="search-empty">No results for "{query}"</div>
            ) : !query ? (
              <div className="search-empty">Type to search...</div>
            ) : (
              results.map((r, i) => (
                <div
                  key={`${r.file}:${r.line}:${i}`}
                  className={`search-item ${i === selectedIdx ? 'selected' : ''}`}
                  onClick={() => {
                    onPick(r.file)
                    onClose?.()
                  }}
                >
                  <div className="search-file">{r.file.split('/').slice(-2).join('/')}:{r.line}</div>
                  <div className="search-preview">{r.preview}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Inline sidebar search (original)
  return (
    <div className="search">
      <input placeholder="Search workspace..." value={query} onChange={(e) => run(e.target.value)} />
      <div className="search-results">
        {results.map((r, i) => (
          <div key={`${r.file}:${r.line}:${i}`} className="search-item" onClick={() => onPick(r.file)}>
            <div className="search-file">{r.file.split('/').slice(-2).join('/')}:L{r.line}</div>
            <div className="search-preview">{r.preview}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
