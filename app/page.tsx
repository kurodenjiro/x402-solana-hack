import Link from 'next/link'

import { PlaygroundCard } from '@/components/playground-card'
import { PlaygroundEditor } from '@/components/editor/playground-editor'
import { listPlaygrounds } from '@/lib/playgrounds'

export default async function Home() {
  const playgrounds = await listPlaygrounds()

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-50">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.35),_transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.25),_transparent_60%)]" />
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-32 pt-20 sm:px-8 lg:px-12">
        <section className="surface-panel p-12 lg:p-16">
          <div className="space-y-8">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Launch AI-native playgrounds directly from Markdown.
            </h1>
            <p className="max-w-2xl text-lg text-neutral-300">
              Author agent workflows with Web3 Markdown, monetize premium steps with x402 Solana payments, and let
              viewers run everything without leaving the page.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
              >
                Open workspace
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-white hover:text-white"
              >
                Explore feed
              </Link>
            </div>
          </div>
        </section>

        <PlaygroundEditor />

        <section className="flex flex-col gap-8 rounded-[3rem] border border-white/5 bg-white/[0.02] p-10 lg:p-16">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">AI-native playgrounds</h2>
              <p className="mt-2 max-w-xl text-sm text-neutral-400">
                Publish Markdown-defined agents, set a price, and share the link—viewers can pay via x402 and run the
                experience instantly.
              </p>
            </div>
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-white hover:text-white"
            >
              Publish your own
            </Link>
          </header>
          <div className="flex flex-col gap-6">
            {playgrounds.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
                <p className="text-lg font-semibold text-neutral-200">No playgrounds yet</p>
                <p className="text-sm text-neutral-400">Be the first to create and publish a playground!</p>
                <Link
                  href="/workspace"
                  className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
                >
                  Create your first playground
                </Link>
              </div>
            ) : (
              playgrounds.map(playground => <PlaygroundCard key={playground.id} playground={playground} />)
            )}
          </div>
        </section>
      </section>
    </div>
  )
}

