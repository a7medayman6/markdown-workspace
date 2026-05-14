# Markdown Workspace

A modern, feature-rich desktop markdown editor & workspace built with **Electron**, **React**, **Vite**, and **TypeScript**. Perfect for managing markdown documentation, notes, and technical writing.

## Features

### Core Editing
- **Live preview** with real-time sync between editor and preview panel
- **Split view** editing with collapsible preview panel for distraction-free writing (zen mode)
- **Auto-save** with unsaved changes indicator
- **Syntax highlighting** via highlight.js for code blocks
- **Tab management** for multiple open files
- **Word count & reading time** estimates in the editor toolbar

### Markdown Support
- **GitHub Flavored Markdown** (GFM) including tables, strikethrough, and task lists
- **KaTeX** rendering for inline and block math formulas
- **Mermaid diagram** rendering for flowcharts, sequence diagrams, etc.
- **Code block** collapsing toggles
- **Responsive preview** with proper typography and styling

### Navigation & Search
- **Workspace browser** — open any local folder and see all markdown files in a tree sidebar
- **Quick open** (Cmd/Ctrl+P) — fast file picker with fuzzy search
- **Global search** (Cmd/Ctrl+Shift+F) — search across all files in workspace with preview lines
- **Outline/TOC sidebar** — automatic table of contents extraction from headings
- **File breadcrumbs** — navigate file paths easily

### Export & Storage
- **PDF export** (Cmd/Ctrl+Shift+E) — render markdown to PDF with native save dialog
- **Full filesystem access** — stored entirely on your machine, no cloud dependency
- **File watchers** — external file changes detected in real-time
- **Create/rename/delete** files directly within the app

### UI/UX
- **Modern minimal design** inspired by Notion, Obsidian, and VSCode
- **Dark/light theme support** (dark by default)
- **Keyboard shortcuts** for all major actions
- **Smooth scroll sync** between editor and preview
- **Responsive editor toolbar** with save, export, and focus mode toggles
- **Zen mode** for distraction-free writing

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation & Development

```bash
# Clone or navigate to the project directory
cd markdown-workspace

# Install dependencies
npm install

# Start development environment (Vite + tsc watch + Electron)
npm run dev
```

The dev server will start Vite on an available port (usually 5173+) and open the Electron app.

### Build & Package

```bash
# Build renderer (Vite) and main process (TypeScript)
npm run build
npm run build:electron

# Package app with electron-builder (Windows, macOS, Linux)
npm run package
npm run package:mac      # macOS only
npm run package:win      # Windows only
npm run package:linux    # Linux only
npm run package:all      # All platforms
```

Packaged binaries will be in the `dist/` directory.

**For detailed packaging instructions, platform-specific setup, code signing, and distribution, see [PACKAGING.md](./PACKAGING.md).**

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Cmd/Ctrl+S** | Save current file |
| **Cmd/Ctrl+P** | Quick open file |
| **Cmd/Ctrl+Shift+F** | Global search workspace |
| **Cmd/Ctrl+Shift+E** | Export to PDF |

## Project Structure

```
markdown-workspace/
├── src/                          # React renderer source
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   ├── components/               # React components
│   │   ├── Editor.tsx
│   │   ├── Preview.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Search.tsx
│   │   ├── Outline.tsx
│   │   ├── Tabs.tsx
│   │   └── CommandPalette.tsx
│   ├── lib/                      # Utilities
│   │   ├── markdown.ts           # Markdown rendering pipeline
│   │   └── outline.ts            # Heading extraction
│   ├── types/
│   │   └── global.d.ts           # Global types for window.api
│   └── styles.css                # Global styles
├── src-electron/                 # Electron main process
│   ├── main.ts                   # Main process entry
│   └── preload.ts                # IPC preload bridge
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
├── tsconfig.electron.json        # Electron TypeScript config
├── package.json                  # Dependencies & scripts
└── README.md                     # This file
```

## Architecture

### Renderer (Frontend)
- **React 18** with TypeScript
- **Vite** for fast HMR and bundling
- **remark/rehype** pipeline for markdown processing
- **highlight.js** for code syntax highlighting
- **mermaid** for diagram rendering
- **KaTeX** for math formulas

### Main Process (Backend)
- **Electron** for app window and native features
- **Node.js filesystem APIs** for file operations
- **chokidar** for file watching
- **IPC bridge** (preload + context isolation) for secure renderer ↔ main communication

### Key IPC APIs Exposed
- `readFile(path)` — read markdown file
- `writeFile(path, content)` — save file
- `listMarkdown(folderPath)` — find all .md files recursively
- `createFile(path)` — create new markdown file
- `rename(oldPath, newPath)` — rename file
- `deleteFile(path)` — delete file
- `openFolder()` — native folder picker
- `exportPdfToFile(html)` — render HTML to PDF and show save dialog
- `startWatch(path)` — begin watching folder for changes

## Configuration

### Vite
Configured in `vite.config.ts`. Includes React Fast Refresh via `@vitejs/plugin-react`.

### TypeScript
- Root `tsconfig.json` for renderer code
- `tsconfig.electron.json` for main process (CommonJS output)

### Electron Builder
Packaged via electron-builder. Configuration in `package.json` under `"build"` key.  
Supports Windows (NSIS), macOS (DMG), and Linux (AppImage, deb).

## Performance Notes

- **Large files**: Editor can handle files up to several MB with minimal lag (React + textarea are efficient).
- **Search**: Linear file scan—fast for typical workspaces (<1000 files). For larger workspaces, consider adding indexing.
- **Preview**: Live rendering is reactive and debounced; no lag even with rapid typing.
- **File watcher**: Ignores dotfiles and common ignore patterns automatically.

## Future Enhancements

- [ ] Configurable themes / custom CSS
- [ ] Plugin architecture
- [ ] Recent workspaces history
- [ ] Sync with cloud storage (optional)
- [ ] Collaborative editing
- [ ] Built-in git integration
- [ ] Better search indexing for large workspaces
- [ ] Image paste and local asset management
- [ ] Dark/light theme toggle

## Troubleshooting

### White/blank page on startup
- Check that Vite is running: look for the `➜ Local: http://localhost:XXXX/` message in terminal.
- Open DevTools (Cmd/Ctrl+Shift+I) and check console for errors.
- Verify `src/main.tsx` is correct and Vite can serve the app.

### Port conflicts
- Vite will auto-increment to the next available port if 5173+ is busy.
- You can reset or check port usage: `lsof -i :5173` (macOS/Linux) or `netstat -ano | findstr :5173` (Windows).

### File not saving
- Check file permissions on the workspace folder.
- Ensure the file path is valid and the folder exists.
- Check the DevTools console and main process terminal for errors.

### PDF export fails
- Verify write permissions to the save location.
- Check that the rendered HTML is valid.
- Look for errors in the DevTools console.

## License

MIT

---

**Built with ♥ using Electron + React + TypeScript**

## Additional Guides

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** — Developer setup, architecture, common tasks, debugging
- **[PACKAGING.md](./PACKAGING.md)** — Platform-specific build/packaging, code signing, distribution checklist
