'use client'

import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'

export function HeaderNav() {
  const { connected, publicKey } = useWallet()

  return (
    <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-300 md:flex">
      <Link href="/feed" className="transition hover:text-white">
        Feed
      </Link>
      <Link href="/docs" className="transition hover:text-white">
        Docs
      </Link>
      {connected && publicKey && (
        <Link
          href={`/profile/${publicKey.toBase58()}`}
          className="transition hover:text-white"
        >
          Profile
        </Link>
      )}
    </nav>
  )
}

