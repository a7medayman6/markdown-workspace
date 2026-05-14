import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readFile: (p: string) => ipcRenderer.invoke('fs:readFile', p),
  writeFile: (p: string, content: string) => ipcRenderer.invoke('fs:writeFile', p, content),
  listMarkdown: (p: string) => ipcRenderer.invoke('fs:listMarkdown', p),
  createFile: (p: string) => ipcRenderer.invoke('fs:createFile', p),
  rename: (a: string, b: string) => ipcRenderer.invoke('fs:rename', a, b),
  deleteFile: (p: string) => ipcRenderer.invoke('fs:delete', p),
  exportPdf: (html: string, options?: any) => ipcRenderer.invoke('pdf:export', html, options),
  exportPdfToFile: (html: string, options?: any) => ipcRenderer.invoke('pdf:saveToFile', html, options),
  startWatch: (p: string) => ipcRenderer.send('watch:start', p),
  onWatchEvent: (cb: (e: any) => void) => ipcRenderer.on('watch:event', (_ev, data) => cb(data))
})
