import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { watch } from 'chokidar'
import http from 'http'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Try to detect a running Vite dev server on common ports (5173..5183).
  async function findDevServerUrl(): Promise<string | null> {
    const ports = Array.from({ length: 11 }, (_, i) => 5173 + i)
    for (const port of ports) {
      const ok = await new Promise<boolean>((resolve) => {
        const req = http.request({ method: 'GET', host: '127.0.0.1', port, path: '/' }, (res) => {
          resolve(res.statusCode === 200)
        })
        req.on('error', () => resolve(false))
        req.setTimeout(300, () => {
          req.destroy()
          resolve(false)
        })
        req.end()
      })
      if (ok) return `http://localhost:${port}`
    }
    return null
  }

  ;(async () => {
    const devUrl = process.env.VITE_DEV_SERVER_URL || (await findDevServerUrl())
    if (devUrl) {
      mainWindow.loadURL(devUrl)
    } else {
      mainWindow.loadFile(path.join(__dirname, '../index.html'))
    }
  })()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC handlers for basic filesystem operations
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (result.canceled || !result.filePaths.length) return null
  return result.filePaths[0]
})

ipcMain.handle('fs:readFile', async (_e, filePath: string) => {
  return fs.promises.readFile(filePath, 'utf-8')
})

ipcMain.handle('fs:writeFile', async (_e, filePath: string, content: string) => {
  return fs.promises.writeFile(filePath, content, 'utf-8')
})

ipcMain.handle('fs:listMarkdown', async (_e, folderPath: string) => {
  const files: string[] = []
  function walk(dir: string) {
    const items = fs.readdirSync(dir, { withFileTypes: true })
    for (const item of items) {
      const full = path.join(dir, item.name)
      if (item.isDirectory()) walk(full)
      else if (/\.md|\.markdown$/i.test(item.name)) files.push(full)
    }
  }
  walk(folderPath)
  return files
})

ipcMain.handle('fs:createFile', async (_e, filePath: string) => {
  await fs.promises.writeFile(filePath, '# New Document\n')
  return true
})

ipcMain.handle('fs:rename', async (_e, oldPath: string, newPath: string) => {
  await fs.promises.rename(oldPath, newPath)
  return true
})

ipcMain.handle('fs:delete', async (_e, filePath: string) => {
  await fs.promises.unlink(filePath)
  return true
})

ipcMain.handle('pdf:export', async (_e, html: string, options: any) => {
  // Create a temporary offscreen BrowserWindow to render HTML and print to PDF
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  const pdf = await win.webContents.printToPDF({ printBackground: true, landscape: false })
  win.close()
  return pdf
})

ipcMain.handle('pdf:saveToFile', async (_e, html: string, options: any) => {
  // Render to PDF in an offscreen window then show native save dialog and write file
  const renderWin = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
  await renderWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  const pdf = await renderWin.webContents.printToPDF({ printBackground: true, landscape: false })
  renderWin.close()

  const focused = BrowserWindow.getFocusedWindow() || mainWindow || null
  const saveOpts = {
    title: 'Export PDF',
    defaultPath: 'export.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  }
  let saved
  if (focused) saved = await dialog.showSaveDialog(focused, saveOpts)
  else saved = await dialog.showSaveDialog(saveOpts)
  const { canceled, filePath } = saved
  if (canceled || !filePath) return { canceled: true }
  await fs.promises.writeFile(filePath, pdf)
  return { canceled: false, filePath }
})

// File watcher util
ipcMain.on('watch:start', (_e, folderPath: string) => {
  const watcher = watch(folderPath, { ignored: /(^|[\/\\])\../, persistent: true })
  watcher.on('all', (event, pathChanged) => {
    mainWindow?.webContents.send('watch:event', { event, path: pathChanged })
  })
})
