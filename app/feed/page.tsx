import Link from 'next/link'

import { PlaygroundCard } from '@/components/playground-card'
import { listPlaygrounds } from '@/lib/playgrounds'

export const metadata = {
  title: 'Playground Feed',
  description: 'Browse published AI-native playgrounds.',
}

export default async function FeedPage() {
  const playgrounds = await listPlaygrounds()

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-50">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.35),_transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.25),_transparent_60%)]" />
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 pb-20 pt-20 sm:px-8">
        <header className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Playground feed</h1>
          <p className="max-w-2xl text-sm text-neutral-400">
            Every listing is authored in Markdown, exposes its default wallet, and links straight to the interactive
            playground.
          </p>
          <Link
            href="/workspace"
            className="inline-flex w-fit items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-neutral-100 transition hover:border-white hover:text-white"
          >
            Create a playground
          </Link>
        </header>

        {playgrounds.length === 0 ? (
          <section className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <p className="text-lg font-semibold text-neutral-200">No playgrounds yet</p>
            <p className="text-sm text-neutral-400">Be the first to create and publish a playground!</p>
            <Link
              href="/workspace"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
            >
              Create your first playground
            </Link>
          </section>
        ) : (
          <section className="flex flex-col gap-6">
            {playgrounds.map(playground => (
              <PlaygroundCard key={playground.id} playground={playground} />
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
