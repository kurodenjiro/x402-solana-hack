import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const mediaSchema = z.object({
  playgroundId: z.string().optional(), // Optional - can be set later when saving playground
  key: z.string(), // Preview key (e.g., "image:0:Agent:prompt")
  type: z.enum(['image', 'audio', 'video']),
  mimeType: z.string(),
  data: z.string(), // Base64 encoded data
})

export const runtime = 'nodejs'

// POST: Store media asset and return URL
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = mediaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { playgroundId, key, type, mimeType, data } = parsed.data

    // Convert base64 string to Buffer
    const base64Data = data.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate unique URL path
    const url = `/api/media/${key.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${type === 'image' ? 'png' : type === 'audio' ? 'mp3' : 'mp4'}`

    // Check if asset already exists with this key
    const existing = playgroundId
      ? await prisma.mediaAsset.findFirst({
          where: { playgroundId, key },
        })
      : null

    if (existing) {
      // Update existing asset
      const updated = await prisma.mediaAsset.update({
        where: { id: existing.id },
        data: {
          data: buffer,
          mimeType,
          url,
        },
      })
      return NextResponse.json({ url: updated.url, id: updated.id })
    }

    // Create new asset
    const asset = await prisma.mediaAsset.create({
      data: {
        playgroundId: playgroundId || '', // Will be updated when playground is saved
        key,
        type,
        mimeType,
        data: buffer,
        url,
      },
    })

    return NextResponse.json({ url: asset.url, id: asset.id })
  } catch (error) {
    console.error('Failed to store media asset', error)
    return NextResponse.json({ error: 'Failed to store media asset.' }, { status: 500 })
  }
}

