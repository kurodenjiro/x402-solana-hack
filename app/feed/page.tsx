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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 bg-neutral-950 px-6 pb-20 pt-20 text-neutral-50 sm:px-8">
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

      <section className="flex flex-col gap-6">
        {playgrounds.map(playground => (
          <PlaygroundCard key={playground.id} playground={playground} />
        ))}
      </section>
    </main>
  )
}
