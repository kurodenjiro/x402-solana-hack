import { NextRequest } from 'next/server'
import { paymentMiddleware, type Network, type RoutesConfig } from 'x402-next'
type Address = `0x${string}`
const defaultReceiver = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as Address | undefined
const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL
const cdpClientKey = process.env.NEXT_PUBLIC_CDP_CLIENT_KEY
const defaultNetwork = (process.env.NEXT_PUBLIC_NETWORK as Network | undefined) ?? 'solana-devnet'

const staticRoutes: RoutesConfig = {
  '/playgrounds/portfolio-copilot': {
    price: '$0.25',
    config: { description: 'Portfolio Copilot playground pricing' },
    network: defaultNetwork,
  },
  '/playgrounds/nft-curator': {
    price: '$0.15',
    config: { description: 'NFT Curator playground pricing' },
    network: defaultNetwork,
  },
}

const middlewareInstance =
  defaultReceiver && facilitatorUrl && cdpClientKey
    ? paymentMiddleware(
      defaultReceiver,
      staticRoutes,
      { url: facilitatorUrl as `${string}://${string}` },
      {
        cdpClientKey,
        appLogo: '/logo.svg',
        appName: 'AI Playground x402',
        sessionTokenEndpoint: '/api/x402/session-token',
      },
    )
    : null

export const middleware = (req: NextRequest) => {
  if (!middlewareInstance) return
  return middlewareInstance(req as any)
}

export const config = {
  matcher: ['/playgrounds/:path*'],
}
