'use client'

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import type { PlaygroundPayload } from '@/lib/playgrounds'

type PlaygroundCardProps = {
  playground: PlaygroundPayload
}

export const PlaygroundCard = ({ playground }: PlaygroundCardProps) => {
  const updatedLabel = playground.updatedAt
    ? new Date(playground.updatedAt as unknown as string | number | Date).toISOString().split('T')[0]
    : ''

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-violet-500/30 hover:bg-white/[0.06]">
      <div className="prose prose-invert max-w-none text-sm text-neutral-200 prose-headings:text-white">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{playground.markdown}</ReactMarkdown>
      </div>
      <footer className="flex items-center justify-between border-t border-white/10 pt-4">
        <Link
          href={playground.resourcePath ?? `/playgrounds/${playground.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-200 transition hover:text-violet-100"
        >
          Open playground ↗
        </Link>
        {updatedLabel ? <span className="text-xs text-neutral-500">Updated {updatedLabel}</span> : null}
      </footer>
    </article>
  )
}


