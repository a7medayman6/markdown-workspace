import React, { useEffect, useState, useRef } from 'react'

type Props = { filePath: string; onOpenInTab?: (p: string) => void }

export default function Editor({ filePath, onOpenInTab }: Props) {
  const [content, setContent] = useState<string>('')
  const [dirty, setDirty] = useState(false)
  const [zen, setZen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    let mounted = true
    window.api.readFile(filePath).then((txt) => {
      if (mounted) {
        setContent(txt)
        setDirty(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [filePath])

  // live preview: dispatch debounced event so Preview can re-render without a file read
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('content:change', { detail: { path: filePath, content } }))
    }, 300)
    return () => clearTimeout(timer)
  }, [content, filePath])

  useEffect(() => {
    const id = setInterval(() => {
      if (dirty) {
        window.api.writeFile(filePath, content)
        setDirty(false)
      }
    }, 2000)
    return () => clearInterval(id)
  }, [dirty, content, filePath])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey
      if (cmd && e.key.toLowerCase() === 's') {
        e.preventDefault()
        window.api.writeFile(filePath, content)
        setDirty(false)
      }
      if (cmd && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        const evt = new CustomEvent('export:pdf', { detail: { path: filePath } })
        window.dispatchEvent(evt)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filePath, content])

  // scroll sync: send scroll ratio to preview
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const onScroll = () => {
      const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1)
      window.dispatchEvent(new CustomEvent('editor:scroll', { detail: { ratio } }))
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [textareaRef.current])

  const words = content.trim().length ? content.trim().split(/\s+/).length : 0
  const minutes = Math.max(1, Math.round(words / 200))

  return (
    <div className={`editor pane ${zen ? 'zen' : ''}`}>
      <div className="editor-toolbar">
        <span className={`status ${dirty ? 'unsaved' : 'saved'}`}>{dirty ? 'Unsaved' : 'Saved'}</span>
        <button onClick={() => { window.api.writeFile(filePath, content); setDirty(false) }}>Save</button>
        <button onClick={() => { window.dispatchEvent(new CustomEvent('export:pdf', { detail: { path: filePath } })) }}>Export PDF</button>
        <button className={zen ? 'active-btn' : ''} onClick={() => setZen((s) => !s)}>{zen ? 'Exit Zen' : 'Zen'}</button>
        <div className="editor-stats">
          <span>{words} words</span>
          <span style={{color:'var(--panel-border)'}}>·</span>
          <span>{minutes} min read</span>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setDirty(true)
        }}
        onDoubleClick={() => onOpenInTab?.(filePath)}
      />
    </div>
  )
}
