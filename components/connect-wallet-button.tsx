'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

type ConnectWalletButtonProps = {
  className?: string
}

export function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const { connected, publicKey, wallet } = useWallet()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const label = useMemo(() => {
    if (!connected || !publicKey) {
      return 'Connect wallet'
    }
    const address = publicKey.toBase58()
    const name = wallet?.adapter?.name ?? 'Wallet'
    return `${name}: ${address.slice(0, 4)}…${address.slice(-4)}`
  }, [connected, publicKey, wallet])

  const defaultClassName =
    'wallet-adapter-button rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:border-white hover:text-white'

  const combinedClassName = className ? `${defaultClassName} ${className}` : defaultClassName

  if (!isMounted) {
    return (
      <button className={combinedClassName} type="button" disabled>
        Connect wallet
      </button>
    )
  }

  return (
    <WalletMultiButton className={combinedClassName} title={label} aria-label={label} />
  )
}

