import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const playgroundSchema = z.object({
  slug: z.string().min(3),
  title: z.string().min(3),
  summary: z.string().min(10),
  markdown: z.string().min(10),
  tags: z.array(z.string()).default([]),
  price: z.string().optional(),
  network: z.enum(['solana', 'solana-devnet']).default('solana-devnet'),
  publisherAddress: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
})

export async function GET() {
  const records = await prisma.playground.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = playgroundSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const payload = parsed.data

  const record = await prisma.playground.upsert({
    where: { slug: payload.slug },
    update: {
      title: payload.title,
      summary: payload.summary,
      markdown: payload.markdown,
      tags: payload.tags,
      price: payload.price,
      network: payload.network,
      publisherAddress: payload.publisherAddress,
      status: payload.status,
      resourcePath: `/playgrounds/${payload.slug}`,
    },
    create: {
      slug: payload.slug,
      title: payload.title,
      summary: payload.summary,
      markdown: payload.markdown,
      tags: payload.tags,
      price: payload.price,
      network: payload.network,
      publisherAddress: payload.publisherAddress,
      status: payload.status,
      resourcePath: `/playgrounds/${payload.slug}`,
    },
  })

  return NextResponse.json(record, { status: 201 })
}

