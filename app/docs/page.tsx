import path from 'node:path'
import { readFile } from 'node:fs/promises'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { parseMarkdownFrontMatter } from '@/lib/playgrounds'

export default async function DocsPage() {
  const docPath = path.join(process.cwd(), 'docs', 'overview.md')
  const markdown = await readFile(docPath, 'utf8')
  const { frontMatter, content } = await parseMarkdownFrontMatter(markdown)

  const title = typeof frontMatter.title === 'string' ? frontMatter.title : 'Documentation'
  const description =
    typeof frontMatter.description === 'string'
      ? frontMatter.description
      : 'Guides for composing Markdown-native playgrounds with x402 integration.'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 pb-24 pt-20 sm:px-8 lg:px-10">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Docs</p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
        <p className="text-sm text-neutral-400">{description}</p>
      </header>

      <article className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-neutral-300 prose-a:text-violet-300 hover:prose-a:text-violet-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}

