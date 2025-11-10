import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  if (!process.env.NEXT_PUBLIC_CDP_CLIENT_KEY) {
    return NextResponse.json({ error: 'CDP client key not configured' }, { status: 500 })
  }

  // TODO: integrate with PayAI facilitator to mint session tokens.
  return NextResponse.json(
    {
      token: null,
      message: 'Session token endpoint not yet implemented. Configure facilitator integration to enable paywall.',
    },
    { status: 501 },
  )
}


