import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeKatex from 'rehype-katex'
import { visit } from 'unist-util-visit'

function rehypeSlug() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (/^h[1-6]$/.test(node.tagName)) {
        const text = (node.children ?? [])
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.value as string)
          .join('')
        const slug = text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-')
        node.properties = node.properties ?? {}
        node.properties.id = slug
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
