import { notFound } from 'next/navigation'
import Link from 'next/link'

import { PlaygroundCard } from '@/components/playground-card'
import { listPlaygroundsByPublisher } from '@/lib/playgrounds'

type ProfilePageProps = {
  params: Promise<{ address: string }>
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { address } = await params
  return {
    title: `Profile - ${address.slice(0, 8)}...${address.slice(-4)}`,
    description: `View all playgrounds created by ${address}`,
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { address } = await params

  if (!address || typeof address !== 'string') {
    notFound()
  }

  const playgrounds = await listPlaygroundsByPublisher(address)

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-50">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.35),_transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.25),_transparent_60%)]" />
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 pb-20 pt-20 sm:px-8">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Profile</h1>
              <p className="mt-2 text-sm text-neutral-400">All playgrounds created by this wallet</p>
            </div>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-neutral-100 transition hover:border-white hover:text-white"
            >
              Back to feed
            </Link>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Wallet Address</span>
                <p className="mt-1 font-mono text-sm text-violet-200">{address}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Playgrounds</span>
                <p className="mt-1 text-2xl font-semibold text-white">{playgrounds.length}</p>
              </div>
            </div>
          </div>
        </header>

        {playgrounds.length === 0 ? (
          <section className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <p className="text-lg font-semibold text-neutral-200">No playgrounds yet</p>
            <p className="text-sm text-neutral-400">This wallet hasn't created any playgrounds.</p>
            <Link
              href="/workspace"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
            >
              Create your first playground
            </Link>
          </section>
        ) : (
          <section className="flex flex-col gap-6">
            <h2 className="text-2xl font-semibold text-white">Created Playgrounds</h2>
            {playgrounds.map(playground => (
              <PlaygroundCard key={playground.id} playground={playground} />
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

