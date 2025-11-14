'use client'

import Link from 'next/link'

import { PlaygroundViewer } from '@/components/playground-viewer'
import type { PlaygroundPayload } from '@/lib/playgrounds'

type PlaygroundCardProps = {
  playground: PlaygroundPayload
}

export const PlaygroundCard = ({ playground }: PlaygroundCardProps) => {
  const updatedLabel = playground.updatedAt
    ? new Date(playground.updatedAt as unknown as string | number | Date).toISOString().split('T')[0]
    : ''
  const publisherAddress = playground.publisherAddress

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-violet-500/30 hover:bg-white/[0.06]">
      {publisherAddress ? (
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-neutral-500">
          <span className="font-semibold text-neutral-200">Created by</span>
          <Link
            href={`/profile/${publisherAddress}`}
            className="font-mono text-[0.65rem] text-violet-200 transition hover:text-violet-100 hover:underline"
          >
            {publisherAddress}
          </Link>
        </div>
      ) : null}
      <div className="prose prose-invert max-w-none text-sm text-neutral-200 prose-headings:text-white">
        <PlaygroundViewer 
          markdown={playground.markdown} 
          previews={
            playground.previews && typeof playground.previews === 'object' && !Array.isArray(playground.previews)
              ? (playground.previews as Record<string, string>)
              : {}
          } 
        />
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


