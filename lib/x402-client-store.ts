'use client'

import { useSyncExternalStore } from 'react'
import type { X402Client } from 'x402-solana'

let x402Client: X402Client | null = null
let listeners: Array<() => void> = []

export const setX402Client = (client: X402Client | null) => {
  x402Client = client
  for (const listener of listeners) {
    listener()
  }
}

const subscribe = (listener: () => void) => {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

const getSnapshot = () => x402Client

export const useX402Client = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)


