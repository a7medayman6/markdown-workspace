import React, { useEffect, useState, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import Tabs from './components/Tabs'
import CommandPalette from './components/CommandPalette'
import Outline from './components/Outline'
import Search from './components/Search'

export default function App() {
  const [workspace, setWorkspace] = useState<string | null>(null)
  const [files, setFiles] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [tabs, setTabs] = useState<string[]>([])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [hidePreview, setHidePreview] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [editorWidth, setEditorWidth] = useState(50)

  const splitRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const openFolder = useCallback(async () => {
    const p = await window.api.openFolder()
    if (p) {
      setWorkspace(p)
      const md = await window.api.listMarkdown(p)
      setFiles(md)
      window.api.startWatch(p)
    }
  }, [])

  // drag-to-resize
  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !splitRef.current) return
      const rect = splitRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setEditorWidth(Math.min(80, Math.max(20, pct)))
    }
    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey
      if (cmd && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (cmd && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-root">
      <Sidebar
        workspace={workspace}
        files={files}
        onOpenFolder={openFolder}
        onOpenFile={(f) => { setActive(f); setTabs((t) => t.includes(f) ? t : [...t, f]) }}
        activeFile={active}
      />
      <div className="editor-area">
        <Tabs
          tabs={tabs}
          active={active}
          onActivate={(p) => setActive(p)}
          onClose={(p) => setTabs((t) => t.filter((x) => x !== p))}
        />
        {active ? (
          <div ref={splitRef} className={`split ${hidePreview ? 'hide-preview' : ''}`}>
            <div className="split-pane" style={{ width: hidePreview ? '100%' : `${editorWidth}%` }}>
              <Editor filePath={active} onOpenInTab={(p) => {
                setActive(p)
                setTabs((t) => t.includes(p) ? t : [...t, p])
              }} />
            </div>

            {!hidePreview && (
              <>
                <div className="split-handle" onMouseDown={onHandleMouseDown}>
                  <div className="split-handle-bar" />
                </div>
                <div className="split-pane" style={{ flex: 1, minWidth: 0 }}>
                  <Preview filePath={active} />
                  <Outline filePath={active} />
                </div>
              </>
            )}

            <div className="focus-toolbar">
              <button
                onClick={() => setHidePreview((s) => !s)}
                title={hidePreview ? 'Show preview' : 'Hide preview'}
              >
                {hidePreview ? '◀' : '▶'}
              </button>
            </div>
          </div>
        ) : (
          <div className="welcome">
            <img src="/markdown-workspace-logo.svg" alt="" className="welcome-logo" />
            <h1>Welcome to Markdown Workspace</h1>
            <button onClick={openFolder}>Open Folder</button>
          </div>
        )}
      </div>
      <CommandPalette
        items={files}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onPick={(p) => { setActive(p); setTabs((t) => t.includes(p) ? t : [...t, p]) }}
      />
      {searchOpen && (
        <Search
          files={files}
          onPick={(p) => { setActive(p); setTabs((t) => t.includes(p) ? t : [...t, p]) }}
          isModal={true}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  )
}
