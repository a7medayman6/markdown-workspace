import React, { useEffect, useState, useRef, useCallback } from 'react'
import { renderMarkdownToHtml } from '@/lib/markdown'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import hljs from 'highlight.js'
import mermaid from 'mermaid'

type Props = { filePath: string }

export default function Preview({ filePath }: Props) {
  const [html, setHtml] = useState<string>('')
  const previewRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const syncingFromEditor = useRef(false)

  const doRender = useCallback(async (markdown: string, cancelled?: { value: boolean }) => {
    const out = await renderMarkdownToHtml(markdown)
    if (cancelled?.value) return
    setHtml(out)
    setTimeout(() => {
      if (cancelled?.value || !containerRef.current) return
      try {
        hljs.highlightAll()

        // mermaid diagrams
        containerRef.current.querySelectorAll('pre > code.language-mermaid').forEach((codeEl, idx) => {
          const codeText = (codeEl.textContent || '').trim()
          const wrapper = document.createElement('div')
          const id = `mermaid-${Date.now()}-${idx}`
          wrapper.id = id
          try {
            mermaid.mermaidAPI.render(id, codeText, (svgCode) => { wrapper.innerHTML = svgCode })
          } catch {
            wrapper.innerText = 'Mermaid render error'
          }
          const pre = codeEl.parentElement
          if (pre?.parentElement) pre.parentElement.replaceChild(wrapper, pre)
        })

        // per-block collapse buttons
        containerRef.current.querySelectorAll('pre').forEach((pre) => {
          const preEl = pre as HTMLElement
          if (preEl.dataset.hasToggle === '1') return
          const btn = document.createElement('button')
          btn.className = 'code-toggle'
          btn.innerText = 'Toggle code'
          btn.addEventListener('click', () => pre.classList.toggle('collapsed'))
          pre.parentElement?.insertBefore(btn, pre)
          preEl.dataset.hasToggle = '1'
        })
      } catch (err) {
        console.error('Post-render processing failed', err)
      }
    }, 60)
  }, [])

  // initial render when file opens
  useEffect(() => {
    const cancelled = { value: false }
    window.api.readFile(filePath).then((txt) => doRender(txt, cancelled))
    return () => { cancelled.value = true }
  }, [filePath, doRender])

  // live update when editor content changes
  useEffect(() => {
    const handler = (ev: any) => {
      if (ev.detail?.path !== filePath) return
      doRender(ev.detail.content)
    }
    window.addEventListener('content:change', handler)
    return () => window.removeEventListener('content:change', handler)
  }, [filePath, doRender])

  // PDF export
  useEffect(() => {
    const onExport = async () => {
      try {
        const txt = await window.api.readFile(filePath)
        const out = await renderMarkdownToHtml(txt)
        const res = await window.api.exportPdfToFile(out, {})
        if (res && !res.canceled) alert('Exported to ' + res.filePath)
      } catch (err) {
        console.error('Export failed', err)
        alert('Export failed. See console.')
      }
    }
    window.addEventListener('export:pdf', onExport as EventListener)
    return () => window.removeEventListener('export:pdf', onExport as EventListener)
  }, [filePath])

  // scroll sync
  useEffect(() => {
    const onEditorScroll = (ev: any) => {
      const ratio = ev.detail?.ratio
      const el = previewRef.current
      if (!el || typeof ratio !== 'number') return

      syncingFromEditor.current = true
      el.scrollTop = ratio * (el.scrollHeight - el.clientHeight || 1)
      window.setTimeout(() => {
        syncingFromEditor.current = false
      }, 80)
    }
    window.addEventListener('editor:scroll', onEditorScroll as EventListener)
    return () => window.removeEventListener('editor:scroll', onEditorScroll as EventListener)
  }, [])

  // scroll sync: send preview scroll ratio to editor
  useEffect(() => {
    const el = previewRef.current
    if (!el) return

    const onScroll = () => {
      if (syncingFromEditor.current) return
      const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1)
      window.dispatchEvent(new CustomEvent('preview:scroll', { detail: { ratio } }))
    }

    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={previewRef} className="preview pane">
      <div ref={containerRef} className="preview-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
