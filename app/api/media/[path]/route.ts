import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type MediaRouteParams = {
  params: Promise<{ path: string }>
}

export const runtime = 'nodejs'

// GET: Serve media asset by URL path
export async function GET(request: Request, { params }: MediaRouteParams) {
  try {
    const { path } = await params
    const decodedPath = decodeURIComponent(path)

    // Find asset by URL
    const asset = await prisma.mediaAsset.findUnique({
      where: { url: `/api/media/${decodedPath}` },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Media asset not found.' }, { status: 404 })
    }

    // Return the binary data with proper content type
    return new NextResponse(asset.data, {
      headers: {
        'Content-Type': asset.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Failed to serve media asset', error)
    return NextResponse.json({ error: 'Failed to serve media asset.' }, { status: 500 })
  }
}

