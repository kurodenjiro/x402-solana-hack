import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'

import { SolanaProvider } from '@/components/solana-provider'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { HeaderNav } from '@/components/header-nav'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'AI Playground x402',
  description:
    'Publish AI-native playgrounds written in Markdown, monetize access with x402, and collaborate through drag-and-drop components.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-neutral-950">
      <body className={`${inter.variable} bg-neutral-950 text-neutral-50 font-sans`}>
        <SolanaProvider>
          <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/75 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg font-semibold text-neutral-900 shadow-lg shadow-violet-500/30">
                  WM
                </span>
                <span className="text-lg font-semibold tracking-tight">AI-native playground</span>
              </Link>
              <HeaderNav />
              <div className="flex items-center gap-3">
                <ConnectWalletButton className="hidden md:inline-flex" />
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-white/10 bg-black/60">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-neutral-400 sm:px-8 lg:px-12">
              <p>
                Built with Next.js, Prisma, and <Link href="https://agents.md/" className="underline">AGENTS.md</Link>{' '}
                inspired workflows.
              </p>
              <p>
                Monetization powered by{' '}
                <Link
                  href="https://github.com/Woody4618/solana-paywal-x402/tree/main"
                  className="underline"
                  target="_blank"
                >
                  x402 Solana examples
                </Link>
                . Markdown playground syntax inspired by{' '}
                <Link href="https://github.com/kurodenjiro/Web3-Markdown" className="underline" target="_blank">
                  Web3 Markdown
                </Link>
                .
              </p>
            </div>
          </footer>
        </SolanaProvider>
      </body>
    </html>
  )
}

