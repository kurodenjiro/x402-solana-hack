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
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-50">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.35),_transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.25),_transparent_60%)]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 pb-24 pt-20 sm:px-8 lg:px-10">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Documentation</p>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
          <p className="text-sm text-neutral-400">{description}</p>
        </header>

        <article className="prose prose-invert max-w-none rounded-3xl border border-white/5 bg-white/[0.02] p-10 lg:p-16 prose-headings:font-semibold prose-headings:text-white prose-p:text-neutral-300 prose-a:text-violet-300 prose-a:transition hover:prose-a:text-violet-200 prose-code:text-violet-200 prose-code:bg-black/40 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  )
}

