import { NextRequest, NextResponse } from 'next/server'

export const middleware = (req: NextRequest) => {
  return NextResponse.next()
}

export const config = {
  matcher: ['/playgrounds/:path*'],
}
