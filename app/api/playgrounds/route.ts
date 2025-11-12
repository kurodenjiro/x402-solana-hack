import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const playgroundSchema = z.object({
  markdown: z.string().min(10),
  publisherAddress: z.string().optional(),
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64)

const extractTitle = (markdown: string) => {
  const headingMatch = markdown.match(/^#\s+(.+)$/m)
  if (headingMatch) {
    return headingMatch[1].trim()
  }

  const firstLine = markdown
    .split('\n')
    .map(line => line.trim())
    .find(line => line.length > 0)

  return firstLine ? firstLine.slice(0, 80) : 'Untitled Playground'
}

const extractSummary = (markdown: string) => {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/^#+\s.*$/gm, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  if (!stripped || stripped.length < 10) {
    return 'Auto-generated summary from Markdown content.'
  }

  return stripped.slice(0, 160)
}

const ensureUniqueSlug = async (base: string) => {
  const candidate = slugify(base) || 'playground'
  const existing = await prisma.playground.findUnique({ where: { slug: candidate } })
  if (!existing) {
    return candidate
  }

  let counter = 2
  while (true) {
    const nextCandidate = `${candidate}-${counter}`
    const next = await prisma.playground.findUnique({ where: { slug: nextCandidate } })
    if (!next) {
      return nextCandidate
    }
    counter += 1
  }
}

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

  const markdown = parsed.data.markdown
  const publisherAddress = parsed.data.publisherAddress || null
  const title = extractTitle(markdown)
  const summary = extractSummary(markdown)
  const slug = await ensureUniqueSlug(title)
  const resourcePath = `/playgrounds/${slug}`

  const record = await prisma.playground.upsert({
    where: { slug },
    update: {
      title,
      summary,
      markdown,
      tags: [],
      price: null,
      network: 'solana-devnet',
      publisherAddress,
      status: 'PUBLISHED',
      resourcePath,
    },
    create: {
      slug,
      title,
      summary,
      markdown,
      tags: [],
      price: null,
      network: 'solana-devnet',
      publisherAddress,
      status: 'PUBLISHED',
      resourcePath,
    },
  })

  const desiredResourcePath = `/playgrounds/${record.id}`
  if (record.resourcePath !== desiredResourcePath) {
    const updated = await prisma.playground.update({
      where: { id: record.id },
      data: { resourcePath: desiredResourcePath },
    })
    return NextResponse.json(updated, { status: 201 })
  }

  return NextResponse.json(record, { status: 201 })
}

