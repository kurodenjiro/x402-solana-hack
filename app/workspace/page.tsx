'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useWallet } from '@solana/wallet-adapter-react'

import { PlaygroundEditor } from '@/components/editor/playground-editor'
import { ConnectWalletButton } from '@/components/connect-wallet-button'

type DraftPayload = {
  markdown: string
  previews?: Record<string, string>
  isGenerating?: boolean
  playgroundId?: string
}

const initialDraft: DraftPayload = {
  markdown: '',
  previews: {},
  isGenerating: false,
}

export default function WorkspacePage() {
  const router = useRouter()
  const { connected, publicKey } = useWallet()
  const [draft, setDraft] = useState<DraftPayload>(initialDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleEditorChange = useCallback((payload: { markdown: string; previews?: Record<string, string>; isGenerating?: boolean }) => {
    setDraft(prev => ({ ...prev, markdown: payload.markdown, previews: payload.previews, isGenerating: payload.isGenerating }))
  }, [])

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    if (!draft.markdown.trim()) {
      setSaving(false)
      setError('Add some Markdown content before publishing.')
      return
    }

    try {
      const response = await fetch('/api/playgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: draft.markdown,
          previews: draft.previews || {},
          publisherAddress: publicKey?.toBase58(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ? JSON.stringify(data.error) : 'Failed to save playground')
      }

      const savedPlayground = await response.json()
      
      // Update draft with playground ID for future media asset linking
      setDraft(prev => ({ ...prev, playgroundId: savedPlayground.id }))

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
          <section className="surface-panel flex flex-col gap-3 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">Markdown playground</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Draft your agent workflow in pure Markdown. Titles, summaries, and metadata are now auto-generated from
                  the content you write here.
                </p>
              </div>
              {publicKey && (
                <Link
                  href={`/profile/${publicKey.toBase58()}`}
                  className="flex flex-col items-end gap-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2 transition hover:border-violet-500/40 hover:bg-black/40"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Publisher</span>
                  <span className="font-mono text-sm text-violet-200">{publicKey.toBase58()}</span>
                </Link>
              )}
            </div>
          </section>

          <PlaygroundEditor 
            initial={{ markdown: draft.markdown, previews: draft.previews }} 
            playgroundId={draft.playgroundId}
            onChange={handleEditorChange} 
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || draft.isGenerating}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving…' : draft.isGenerating ? 'Generating content…' : 'Save playground'}
            </button>
            {error ? <span className="text-sm text-rose-400">{error}</span> : null}
            {success ? <span className="text-sm text-emerald-400">{success}</span> : null}
          </div>
        </>
      )}
    </div>
  )
}

