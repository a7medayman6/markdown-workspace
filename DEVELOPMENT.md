# Development Guide

This guide covers setting up for development, understanding the codebase, and contributing to Markdown Workspace.

## Development Setup

### Prerequisites
- Node.js 16+ (check with `node -v`)
- npm 8+ (check with `npm -v`)
- Git
- A code editor (VS Code, WebStorm, etc.)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/markdown-workspace.git
cd markdown-workspace

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open automatically. Vite will print the dev server URL (usually http://localhost:5173).

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + tsc watch + Electron app |
| `npm run build:renderer` | Build React/Vite bundle for production |
| `npm run build:electron` | Compile TypeScript main process to JS |
| `npm run build` | Full production build (both renderer & main) |
| `npm start` | Run compiled app without Vite dev server |
| `npm run lint` | Run ESLint (configure as needed) |

### Project Structure Deep Dive

```
src/                    # React + Vite renderer
├── App.tsx            # Root component, state management
├── main.tsx           # Vite entry point, React bootstrap
├── styles.css         # Global CSS (Tailwind or custom)
├── components/
│   ├── Editor.tsx     # Monaco/textarea editor with save/export
│   ├── Preview.tsx    # Markdown preview, PDF export handler
│   ├── Sidebar.tsx    # File browser, new file button
│   ├── Tabs.tsx       # Tab bar for open files
│   ├── Search.tsx     # Workspace search (modal + inline)
│   ├── CommandPalette.tsx  # Cmd+P quick open
│   └── Outline.tsx    # Table of contents from headings
├── lib/               # Utilities
│   ├── markdown.ts    # Unified pipeline: parse → transform → render
│   └── outline.ts     # Extract headings from markdown
└── types/
    └── global.d.ts    # window.api type definitions

src-electron/          # Electron main process
├── main.ts            # App window, menu, IPC handlers
└── preload.ts         # Context-isolated IPC bridge

dist/                  # Built Vite app (committed to .gitignore)
dist-electron/         # Compiled Electron main process

vite.config.ts         # Vite configuration
tsconfig.json          # Renderer TypeScript config
tsconfig.electron.json # Main process TypeScript config
package.json           # Dependencies & metadata
```

---

## Architecture & Key Concepts

### IPC (Inter-Process Communication)

The app uses Electron's IPC with context isolation for security.

**Flow:**
1. Renderer calls `window.api.readFile(path)` (exposed by preload)
2. Preload forwards to main via `ipcRenderer.invoke('fs:readFile', path)`
3. Main handles in `ipcMain.handle('fs:readFile', ...)`
4. Response sent back through the chain

**Key IPC Handlers (src-electron/main.ts):**
```typescript
ipcMain.handle('dialog:openFolder', ...) // Native folder picker
ipcMain.handle('fs:readFile', ...) // Read file to buffer
ipcMain.handle('fs:writeFile', ...) // Write file from buffer
ipcMain.handle('fs:listMarkdown', ...) // Scan folder recursively
ipcMain.handle('pdf:saveToFile', ...) // Render HTML → PDF → save
```

**IPC API (Exposed via preload.ts):**
```typescript
window.api = {
  openFolder: () => Promise<string | null>,
  readFile: (path) => Promise<string>,
  writeFile: (path, content) => Promise<void>,
  listMarkdown: (folderPath) => Promise<string[]>,
  createFile: (path) => Promise<boolean>,
  rename: (oldPath, newPath) => Promise<boolean>,
  deleteFile: (path) => Promise<boolean>,
  exportPdfToFile: (html) => Promise<{canceled: boolean; filePath?: string}>,
  startWatch: (path) => void,
  onWatchEvent: (cb) => void
}
```

### Markdown Rendering Pipeline

Located in `src/lib/markdown.ts` using `unified` ecosystem:

```
Input Markdown
  ↓
remark-parse (parse → AST)
  ↓
remark-gfm (GitHub Flavored Markdown)
  ↓
remark-rehype (transform to HTML AST)
  ↓
rehype-katex (math rendering)
  ↓
rehype-stringify (serialize → HTML)
  ↓
Output HTML
```

**Client-side enhancements in Preview.tsx:**
- highlight.js: code block highlighting
- mermaid: diagram rendering
- Code toggle buttons (collapse/expand)

### State Management

Simple React hooks pattern (no Redux):

**App.tsx:**
- `workspace` — current folder path
- `files` — list of .md files in workspace
- `active` — currently open file path
- `tabs` — array of open file paths
- `hidePreview` — preview panel visible?
- `searchOpen` — global search modal visible?

**Component state:**
- Editor: `content`, `dirty`, `zen` mode
- Preview: `html`, `hideCode`, `showCodeOnly`
- Sidebar: search results, file tree

### File Watching

**Implementation (src-electron/main.ts):**
```typescript
import { watch } from 'chokidar'

ipcMain.on('watch:start', (event, folderPath) => {
  const watcher = watch(folderPath, {ignored: /\..*/})
  watcher.on('all', (event, path) => {
    mainWindow?.webContents.send('watch:event', {event, path})
  })
})
```

Renderer listens via:
```typescript
window.api.onWatchEvent((data) => {
  // Update UI if file changed externally
})
```

---

## Common Development Tasks

### Adding a New Markdown Feature

Example: Add strikethrough support

1. **Update markdown pipeline** (`src/lib/markdown.ts`):
   ```typescript
   // Add to unified pipeline
   .use(remarkGfm) // Already includes strikethrough
   ```

2. **Test in Preview.tsx**: Markdown with `~~strikethrough~~` should render.

3. **Update README** with feature.

### Adding a New Keyboard Shortcut

Example: Add Cmd+Shift+D to focus editor

1. **In Editor.tsx**:
   ```typescript
   useEffect(() => {
     const onKey = (e: KeyboardEvent) => {
       const cmd = e.metaKey || e.ctrlKey
       if (cmd && e.shiftKey && e.key.toLowerCase() === 'd') {
         e.preventDefault()
         textareaRef.current?.focus()
       }
     }
     window.addEventListener('keydown', onKey)
     return () => window.removeEventListener('keydown', onKey)
   }, [])
   ```

2. **Document in README** shortcuts table.

### Adding a New IPC Handler

Example: Get file statistics

1. **In src-electron/main.ts**:
   ```typescript
   ipcMain.handle('fs:stat', async (_e, filePath: string) => {
     const stats = await fs.promises.stat(filePath)
     return { size: stats.size, mtime: stats.mtime }
   })
   ```

2. **In src-electron/preload.ts**:
   ```typescript
   contextBridge.exposeInMainWorld('api', {
     // ... existing methods
     stat: (p: string) => ipcRenderer.invoke('fs:stat', p)
   })
   ```

3. **In src/types/global.d.ts**:
   ```typescript
   declare global {
     interface Window {
       api: {
         stat: (p: string) => Promise<{size: number; mtime: Date}>
         // ... rest of API
       }
     }
   }
   ```

4. **Use in component**:
   ```typescript
   const stats = await window.api.stat(filePath)
   ```

### Styling Components

Uses global CSS in `src/styles.css`. BEM-like naming:

```css
/* Parent component */
.editor-toolbar {
  display: flex;
  gap: 12px;
}

/* Child elements */
.editor-toolbar button {
  padding: 8px 12px;
  border-radius: 6px;
}

.editor-toolbar button:hover {
  background: rgba(255, 255, 255, 0.1);
}
```

---

## Debugging

### Browser DevTools (Renderer)
```
Electron Menu → View → Toggle Developer Tools
Or: Cmd/Ctrl+Shift+I
```

Inspect React components, network, console, etc.

### Main Process Debugging

In `src-electron/main.ts`:
```typescript
console.log('Debug message', variable)
```

Logs appear in the terminal where you ran `npm run dev`.

### Hot Reload

Vite handles React component changes automatically. TypeScript changes to `src-electron/` require tsc watch to recompile (already running via npm run dev).

---

## Testing (Optional Setup)

Install testing libraries:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

Example test (`src/components/Editor.test.tsx`):
```typescript
import { render, screen } from '@testing-library/react'
import Editor from './Editor'

test('renders editor textarea', () => {
  render(<Editor filePath="/test.md" />)
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})
```

Run tests:
```bash
npm test
```

---

## Performance Optimization

### Large Files
- Editor uses uncontrolled component patterns for initial perf
- Consider debouncing onChange for very large files (>10MB)

### Preview Rendering
- Already debounced via useEffect
- Consider virtualizing very long markdown documents

### Search
- Currently linear scan; for 10k+ files, add full-text indexing (lunr.js, fuse.js)

### Bundle Size
- Keep dependencies minimal; only add if truly necessary
- Monitor with Vite's built-in bundle analyzer

---

## Code Quality Standards

- **TypeScript**: Strict mode enabled; type all public functions/props
- **React**: Functional components + hooks; avoid class components
- **CSS**: No CSS-in-JS; simple global CSS or BEM
- **Comments**: Add comments for non-obvious logic
- **File naming**: PascalCase for components, camelCase for utilities

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/new-feature`
3. Make changes and test
4. Commit with clear messages: `git commit -m 'Add new feature'`
5. Push to your fork
6. Open a Pull Request with descriptive title/body

---

## Resources

- [Electron Docs](https://www.electronjs.org/docs)
- [React Hooks](https://react.dev/reference/react/hooks)
- [Unified Markdown Processing](https://unifiedjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
