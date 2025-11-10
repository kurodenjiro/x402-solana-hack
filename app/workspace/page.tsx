'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useWallet } from '@solana/wallet-adapter-react'

import { PlaygroundEditor } from '@/components/editor/playground-editor'
import { ConnectWalletButton } from '@/components/connect-wallet-button'

type DraftPayload = {
  title: string
  summary: string
  slug: string
  price?: string
  tags: string
  markdown: string
  publisherAddress?: string
  network: 'solana' | 'solana-devnet'
  status: 'DRAFT' | 'PUBLISHED'
}

const initialDraft: DraftPayload = {
  title: '',
  summary: '',
  slug: '',
  price: '',
  tags: '',
  markdown: '',
  publisherAddress: '',
  network: 'solana-devnet',
  status: 'DRAFT',
}

export default function WorkspacePage() {
  const router = useRouter()
  const { connected, publicKey } = useWallet()
  const [draft, setDraft] = useState<DraftPayload>(initialDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleEditorChange = useCallback((payload: { markdown: string }) => {
    setDraft(prev => ({ ...prev, markdown: payload.markdown }))
  }, [])

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/playgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          tags: draft.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          price: draft.price?.length ? draft.price : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ? JSON.stringify(data.error) : 'Failed to save playground')
      }

      setSuccess('Playground saved! Redirecting to feed…')
      setTimeout(() => router.push('/#playgrounds'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save playground.')
    } finally {
      setSaving(false)
    }
  }

  const gated = !connected || !publicKey

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-24 pt-16 sm:px-8 lg:px-12">
      <header className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Workspace</span>
        <h1 className="text-4xl font-semibold text-white">Create a Markdown-native playground</h1>
        <p className="text-sm text-neutral-400">
          Combine structured Markdown, wallet-authenticated publishing, and x402 monetization.
        </p>
      </header>

      {gated ? (
        <section className="surface-panel flex flex-col gap-6 p-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold text-white">Connect your wallet to continue</h2>
            <p className="text-sm text-neutral-400">
              Publishing requires an authenticated Solana wallet. This mirrors the flow used in the{' '}
              <Link
                href="https://github.com/Woody4618/solana-paywal-x402"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                x402 paywall demo
              </Link>{' '}
              where agents unlock actions only after wallet login. Connect via the wallet modal, then return to build
              your playground.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Wallet status</p>
              <p className="text-xs text-neutral-400">{connected ? 'Wallet connected' : 'Wallet connection required'}</p>
            </div>
            <ConnectWalletButton />
          </div>
          <ul className="grid gap-3 text-sm text-neutral-300 sm:grid-cols-2">
            <li className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">1. Open the wallet modal and sign in.</li>
            <li className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              2. Link a Phantom or Solflare wallet just like the animate flow in the paywall example.
            </li>
            <li className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              3. Return here to unlock the Markdown editor.
            </li>
            <li className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              4. Publish and price your playground with x402.
            </li>
          </ul>
        </section>
      ) : null}

      {!gated && (
        <>
          <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-300">Title</span>
                <input
                  value={draft.title}
                  onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-violet-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-300">Summary</span>
                <textarea
                  value={draft.summary}
                  onChange={event => setDraft(prev => ({ ...prev, summary: event.target.value }))}
                  rows={4}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-violet-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-300">Slug</span>
                <input
                  value={draft.slug}
                  onChange={event => setDraft(prev => ({ ...prev, slug: event.target.value.replace(/\s+/g, '-') }))}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-violet-500"
                />
                <span className="text-xs text-neutral-500">Example: portfolio-copilot</span>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-300">Price (optional)</span>
                <input
                  value={draft.price}
                  onChange={event => setDraft(prev => ({ ...prev, price: event.target.value }))}
                  placeholder="$0.20"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-violet-500"
                />
              </label>
            </div>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-300">Tags</span>
                <input
                  value={draft.tags}
                  onChange={event => setDraft(prev => ({ ...prev, tags: event.target.value }))}
                  placeholder="agents, defi, analytics"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-violet-500"
                />
                <span className="text-xs text-neutral-500">Comma separated</span>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-300">Network</span>
                <select
                  value={draft.network}
                  onChange={event =>
                    setDraft(prev => ({ ...prev, network: event.target.value as DraftPayload['network'] }))
                  }
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-violet-500"
                >
                  <option value="solana-devnet">solana-devnet</option>
                  <option value="solana">solana (mainnet)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-300">Status</span>
                <select
                  value={draft.status}
                  onChange={event =>
                    setDraft(prev => ({ ...prev, status: event.target.value as DraftPayload['status'] }))
                  }
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-violet-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-300">Publisher wallet (optional)</span>
                <input
                  value={draft.publisherAddress ?? ''}
                  onChange={event => setDraft(prev => ({ ...prev, publisherAddress: event.target.value }))}
                  placeholder="Wallet address for payouts"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-violet-500"
                />
              </label>
            </div>
          </section>

          <PlaygroundEditor initial={{ markdown: draft.markdown }} onChange={handleEditorChange} />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving…' : 'Save playground'}
            </button>
            {error ? <span className="text-sm text-rose-400">{error}</span> : null}
            {success ? <span className="text-sm text-emerald-400">{success}</span> : null}
          </div>
        </>
      )}
    </div>
  )
}

