import React from 'react'

type Props = {
  tabs: string[]
  active: string | null
  onActivate: (p: string) => void
  onClose: (p: string) => void
}

export default function Tabs({ tabs, active, onActivate, onClose }: Props) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <div key={t} className={`tab ${t === active ? 'active' : ''}`} onClick={() => onActivate(t)}>
          <span className="tab-name">{t.split('/').pop()}</span>
          <button className="tab-close" onClick={(e) => { e.stopPropagation(); onClose(t) }}>×</button>
        </div>
      ))}
    </div>
  )
}
