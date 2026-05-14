import React, { useState } from 'react'
import Search from './Search'

type Props = {
  workspace: string | null
  files: string[]
  onOpenFolder: () => void
  onOpenFile: (path: string) => void
  activeFile?: string | null
}

type TreeNode = {
  name: string
  fullPath: string
  children: TreeNode[]
  isFile: boolean
}

function buildTree(files: string[], workspace: string): TreeNode[] {
  const root: TreeNode[] = []

  for (const file of files) {
    const rel = file.replace(workspace + '/', '')
    const parts = rel.split('/')
    let nodes = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      let node = nodes.find((n) => n.name === part)
      if (!node) {
        node = { name: part, fullPath: isFile ? file : '', children: [], isFile }
        nodes.push(node)
      }
      nodes = node.children
    }
  }

  // sort: folders first, then files, both alphabetically
  function sort(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach((n) => sort(n.children))
  }
  sort(root)

  return root
}

function TreeItem({
  node,
  depth,
  onOpenFile,
  activeFile,
}: {
  node: TreeNode
  depth: number
  onOpenFile: (p: string) => void
  activeFile?: string | null
}) {
  const [open, setOpen] = useState(true)
  const indent = depth * 14

  if (node.isFile) {
    return (
      <div
        className={`tree-item tree-file ${activeFile === node.fullPath ? 'active-file' : ''}`}
        style={{ paddingLeft: indent + 8 }}
        onClick={() => onOpenFile(node.fullPath)}
        title={node.fullPath}
      >
        <span className="tree-icon">📄</span>
        <span className="tree-label">{node.name}</span>
      </div>
    )
  }

  return (
    <div>
      <div
        className="tree-item tree-dir"
        style={{ paddingLeft: indent + 8 }}
        onClick={() => setOpen((s) => !s)}
      >
        <span className="tree-icon">{open ? '▾' : '▸'}</span>
        <span className="tree-label">{node.name}</span>
      </div>
      {open && node.children.map((child) => (
        <TreeItem
          key={child.name}
          node={child}
          depth={depth + 1}
          onOpenFile={onOpenFile}
          activeFile={activeFile}
        />
      ))}
    </div>
  )
}

export default function Sidebar({ workspace, files, onOpenFolder, onOpenFile, activeFile }: Props) {
  const tree = workspace ? buildTree(files, workspace) : []

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src="/markdown-workspace-logo.svg" alt="" className="app-logo" />
          <div>
            <strong>Markdown Workspace</strong>
            <span>Files</span>
          </div>
        </div>
        <button onClick={onOpenFolder}>Open Folder</button>
      </div>

      <div className="file-tree">
        {workspace ? (
          tree.length ? (
            <div className="tree-root">
              <div className="tree-workspace-label" title={workspace}>
                <span className="tree-icon">🗂</span>
                <span className="tree-label">{workspace.split('/').pop()}</span>
              </div>
              {tree.map((node) => (
                <TreeItem
                  key={node.name}
                  node={node}
                  depth={1}
                  onOpenFile={onOpenFile}
                  activeFile={activeFile}
                />
              ))}
            </div>
          ) : (
            <div className="empty">No markdown files found.</div>
          )
        ) : (
          <div className="empty">No workspace open.</div>
        )}
      </div>

      <div className="sidebar-footer">
        <Search files={files} onPick={(f) => onOpenFile(f)} />
        <button onClick={async () => {
          if (!workspace) return onOpenFolder()
          const name = prompt('New file name (relative to workspace), e.g. notes/new.md')
          if (!name) return
          const full = `${workspace}/${name}`
          await window.api.createFile(full)
          window.location.reload()
        }}>+ New File</button>
      </div>
    </aside>
  )
}
