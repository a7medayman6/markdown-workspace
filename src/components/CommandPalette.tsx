import React, { useEffect, useState } from 'react'

type Props = {
  items: string[]
  open: boolean
  onClose: () => void
  onPick: (item: string) => void
}

export default function CommandPalette({ items, open, onClose, onPick }: Props) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  if (!open) return null

  const filtered = items.filter((i) => i.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="cmd-palette">
      <div className="cmd-input">
        <input autoFocus placeholder="Quick open..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={onClose}>Esc</button>
      </div>
      <div className="cmd-list">
        {filtered.map((f) => (
          <div key={f} className="cmd-item" onClick={() => { onPick(f); onClose() }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  )
}
