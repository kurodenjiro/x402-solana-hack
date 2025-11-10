'use client'

import Link from 'next/link'

import type { PlaygroundPayload } from '@/lib/playgrounds'

type PlaygroundCardProps = {
  playground: PlaygroundPayload
}

export const PlaygroundCard = ({ playground }: PlaygroundCardProps) => {
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-violet-500/30 hover:bg-white/[0.06]">
      <header className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
          {playground.tags.join(' • ')}
        </span>
        {playground.price ? (
          <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
            {playground.price}
          </span>
        ) : (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Free
          </span>
        )}
      </header>
      <div>
        <h3 className="text-xl font-semibold text-white">{playground.title}</h3>
        <p className="mt-2 text-sm text-neutral-300">{playground.summary}</p>
      </div>
      <footer className="flex items-center justify-between">
        <Link
          href={playground.resourcePath}
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-200 transition hover:text-violet-100"
        >
          Open playground ↗
        </Link>
        {playground.publisherAddress ? (
          <span className="text-xs text-neutral-500">
            {playground.publisherAddress.slice(0, 4)}...{playground.publisherAddress.slice(-4)}
          </span>
        ) : null}
      </footer>
    </article>
  )
}


