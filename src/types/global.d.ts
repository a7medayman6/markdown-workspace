export {}

declare global {
  interface Window {
    api: {
      openFolder: () => Promise<string | null>
      readFile: (p: string) => Promise<string>
      writeFile: (p: string, content: string) => Promise<void>
      listMarkdown: (p: string) => Promise<string[]>
      createFile: (p: string) => Promise<boolean>
      rename: (a: string, b: string) => Promise<boolean>
      deleteFile: (p: string) => Promise<boolean>
      exportPdf: (html: string, options?: any) => Promise<Uint8Array>
      exportPdfToFile: (html: string, options?: any) => Promise<{ canceled: boolean; filePath?: string }>
      startWatch: (p: string) => void
      onWatchEvent: (cb: (e: any) => void) => void
    }
  }
}
