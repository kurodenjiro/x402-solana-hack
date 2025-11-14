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
    const fullUrl = `/api/media/${decodedPath}`

    console.log('[Media Serve] Request path:', path, 'decoded:', decodedPath, 'full URL:', fullUrl)

    // Find asset by exact URL match first
    let asset = await prisma.mediaAsset.findUnique({
      where: { url: fullUrl },
    })

    if (!asset) {
      // Try to find by filename (the part after /api/media/)
      const filename = decodedPath
      asset = await prisma.mediaAsset.findFirst({
        where: {
          url: { endsWith: filename },
        },
      })
    }

    if (!asset) {
      // Try to find by key if the decodedPath contains the key pattern
      // Extract potential key from filename (remove timestamp and extension)
      const keyMatch = decodedPath.match(/^([^_]+(?:_[^_]+)*)_\d+\.(png|jpg|jpeg|mp3|wav|ogg|m4a)$/i)
      if (keyMatch) {
        const potentialKey = keyMatch[1].replace(/_/g, ':')
        asset = await prisma.mediaAsset.findFirst({
          where: { key: potentialKey },
        })
      }
    }

    if (!asset) {
      console.error('[Media Serve] Asset not found for URL:', fullUrl, 'path:', decodedPath)
      // List some existing URLs for debugging
      const sampleAssets = await prisma.mediaAsset.findMany({
        take: 5,
        select: { url: true, key: true, type: true },
      })
      console.log('[Media Serve] Sample existing assets:', sampleAssets)
      return NextResponse.json({ 
        error: 'Media asset not found.', 
        debug: { 
          requested: fullUrl, 
          path: decodedPath,
          sample: sampleAssets 
        } 
      }, { status: 404 })
    }

    console.log('[Media Serve] Found asset:', asset.id, asset.type, asset.mimeType, 'data size:', asset.data?.length || 0)

    // Ensure data is a Buffer (Prisma Bytes fields return Buffer)
    const buffer = Buffer.isBuffer(asset.data) ? asset.data : Buffer.from(asset.data)

    if (!buffer || buffer.length === 0) {
      console.error('[Media Serve] Asset has no data:', asset.id)
      return NextResponse.json({ error: 'Media asset has no data.' }, { status: 500 })
    }

    // Return the binary data with proper content type
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': asset.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[Media Serve] Failed to serve media asset', error)
    return NextResponse.json({ error: 'Failed to serve media asset.' }, { status: 500 })
  }
}

