'use server'

import matter from 'gray-matter'

import { prisma } from '@/lib/prisma'

export type PlaygroundPayload = {
  id: string
  slug: string
  title: string
  summary: string
  markdown: string
  tags: string[]
  price?: string | null
  network: string
  resourcePath: string
  publisherAddress?: string | null
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: Date
  updatedAt: Date
}

export const listPlaygrounds = async (): Promise<PlaygroundPayload[]> => {
  const records = await prisma.playground.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return records
}

export const loadPlaygroundBySlug = async (slug: string): Promise<PlaygroundPayload | null> => {
  const record = await prisma.playground.findUnique({ where: { slug } })
  return record ?? null
}

export const parseMarkdownFrontMatter = async (markdown: string) => {
  const parsed = matter(markdown)
  return {
    frontMatter: parsed.data ?? {},
    content: parsed.content,
  }
}


