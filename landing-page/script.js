const $ = (selector, scope = document) => scope.querySelector(selector)
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector))

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function initCursor() {
  const dot = $('.cursor-dot')
  const ring = $('.cursor-ring')
  if (!dot || !ring || window.matchMedia('(max-width: 980px)').matches) return

  let mouseX = window.innerWidth / 2
  let mouseY = window.innerHeight / 2
  let ringX = mouseX
  let ringY = mouseY

  window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX
    mouseY = event.clientY
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`
  })

  function render() {
    ringX += (mouseX - ringX) * 0.18
    ringY += (mouseY - ringY) * 0.18
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`
    requestAnimationFrame(render)
  }
  render()

  $$('a, button, .feature-card, .motion-card, .price-card, .testimonial').forEach((item) => {
    item.addEventListener('mouseenter', () => ring.classList.add('is-hovering'))
    item.addEventListener('mouseleave', () => ring.classList.remove('is-hovering'))
  })
}

function initReveals() {
  const revealItems = $$('.reveal')
  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'))
    return
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.16, rootMargin: '0px 0px -60px' })

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 6, 5) * 60}ms`
    observer.observe(item)
  })
}

const documents = {
  brief: `# Product Brief

Markdown Workspace is a local-first writing system for teams who think in plain text.

- Fast split-pane editing
- Folder native organization
- Beautiful PDF handoff

\`Status: ready for review\``,
  diagram: `# Release Flow

\`\`\`mermaid
graph LR
  Draft --> Review
  Review --> Export
  Export --> Ship
\`\`\`

Keep the diagram beside the prose so context never drifts.`,
  export: `# Print-Ready Notes

Create crisp documents with:

1. Clean typography
2. Rendered code blocks
3. Mermaid diagrams
4. PDF export presets`
}

function renderMarkdownLite(markdown) {
  const lines = markdown.split('\n')
  let inCode = false
  let html = ''

  lines.forEach((line) => {
    if (line.startsWith('```')) {
      inCode = !inCode
      html += inCode ? '<pre><code>' : '</code></pre>'
      return
    }

    if (inCode) {
      html += `${line.replace(/[<>&]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[char]))}\n`
      return
    }

    if (line.startsWith('# ')) html += `<h3>${line.slice(2)}</h3>`
    else if (line.startsWith('- ')) html += `<ul><li>${line.slice(2)}</li></ul>`
    else if (/^\d+\. /.test(line)) html += `<ul><li>${line.replace(/^\d+\. /, '')}</li></ul>`
    else if (line.trim()) html += `<p>${line.replace(/`([^`]+)`/g, '<code>$1</code>')}</p>`
  })

  return html.replace(/<\/ul>\s*<ul>/g, '')
}

function typeDocument(name = 'brief') {
  const source = $('#typing-code')
  const rendered = $('#rendered-document')
  if (!source || !rendered) return

  const text = documents[name]
  let index = 0
  source.textContent = ''
  rendered.innerHTML = renderMarkdownLite(text)

  if (prefersReducedMotion) {
    source.textContent = text
    return
  }

  const timer = setInterval(() => {
    source.textContent = text.slice(0, index)
    index += 2
    if (index > text.length) clearInterval(timer)
  }, 16)
}

function initEditorPreview() {
  typeDocument('brief')
  $$('.toolbar-group button').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.toolbar-group button').forEach((item) => item.classList.remove('active'))
      button.classList.add('active')
      typeDocument(button.dataset.doc)
    })
  })
}

function initThemePreview() {
  const showcase = $('#theme-showcase')
  if (!showcase) return

  $$('.theme-controls button').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.theme-controls button').forEach((item) => item.classList.remove('active'))
      button.classList.add('active')
      showcase.classList.toggle('light', button.dataset.theme === 'light')
    })
  })

  if (!prefersReducedMotion) {
    setInterval(() => {
      const next = showcase.classList.contains('light') ? 'dark' : 'light'
      $(`.theme-controls button[data-theme="${next}"]`).click()
    }, 5200)
  }
}

function initCounters() {
  const count = $('[data-count]')
  if (!count) return

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return
    const target = Number(count.dataset.count)
    const start = performance.now()

    function tick(now) {
      const progress = Math.min((now - start) / 1300, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      count.textContent = `${Math.floor(target * eased / 1000) * 1000 / 1000}k+`
      if (progress < 1) requestAnimationFrame(tick)
      else count.textContent = '10k+'
    }

    requestAnimationFrame(tick)
    observer.disconnect()
  }, { threshold: 0.4 })

  observer.observe(count)
}

function initParallax() {
  const items = $$('[data-parallax]')
  if (prefersReducedMotion || !items.length) return

  window.addEventListener('scroll', () => {
    const y = window.scrollY
    items.forEach((item) => {
      const speed = Number(item.dataset.parallax || 0)
      item.style.transform = `translate3d(0, ${y * speed}px, 0)`
    })
  }, { passive: true })
}

function initDockState() {
  const sections = ['top', 'features', 'editor', 'themes', 'pricing']
    .map((id) => document.getElementById(id))
    .filter(Boolean)
  const links = $$('.dock-nav a')

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)
      })
    })
  }, { threshold: 0.35 })

  sections.forEach((section) => observer.observe(section))
}

function initMagneticButtons() {
  if (prefersReducedMotion) return
  $$('.magnetic').forEach((button) => {
    button.addEventListener('mousemove', (event) => {
      const rect = button.getBoundingClientRect()
      const x = event.clientX - rect.left - rect.width / 2
      const y = event.clientY - rect.top - rect.height / 2
      button.style.transform = `translate(${x * 0.08}px, ${y * 0.18}px)`
    })
    button.addEventListener('mouseleave', () => {
      button.style.transform = ''
    })
  })
}

initCursor()
initReveals()
initEditorPreview()
initThemePreview()
initCounters()
initParallax()
initDockState()
initMagneticButtons()
