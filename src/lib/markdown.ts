import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeKatex from 'rehype-katex'
import { visit } from 'unist-util-visit'
import { createHeadingSlugger } from './outline'

function textContent(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map((child: any) => textContent(child)).join('')
}

function rehypeSlug() {
  return (tree: any) => {
    const slug = createHeadingSlugger()

    visit(tree, 'element', (node: any) => {
      if (/^h[1-6]$/.test(node.tagName)) {
        const text = textContent(node).trim()
        node.properties = node.properties ?? {}
        node.properties.id = slug(text)
      }
    })
  }
}

export async function renderMarkdownToHtml(markdown: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(markdown)
  return String(file)
}
