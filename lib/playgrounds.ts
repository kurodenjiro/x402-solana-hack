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
  try {
    const records = await prisma.playground.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const normalized = await Promise.all(
      records.map(async record => {
        const desiredResourcePath = `/playgrounds/${record.id}`
        if (record.resourcePath !== desiredResourcePath) {
          try {
            const updated = await prisma.playground.update({
              where: { id: record.id },
              data: { resourcePath: desiredResourcePath },
            })
            return updated
          } catch (error) {
            console.error('Failed to normalize playground resourcePath', { id: record.id, error })
          }
        }
        return record
      }),
    )

    return normalized
  } catch (error) {
    console.error('Failed to list playgrounds - database connection error:', error)
    // Return empty array instead of crashing the app
    return []
  }
}

export const loadPlaygroundBySlug = async (slug: string): Promise<PlaygroundPayload | null> => {
  const record = await prisma.playground.findUnique({ where: { slug } })
  return record ?? null
}

export const loadPlaygroundById = async (id: string): Promise<PlaygroundPayload | null> => {
  const sanitizedId = id?.trim()
  if (!sanitizedId) {
    return null
  }

  try {
    const record = await prisma.playground.findUnique({ where: { id: sanitizedId } })
    return record ?? null
  } catch (error) {
    console.error('Failed to load playground by id', { id: sanitizedId, error })
    return null
  }
}

export const listPlaygroundsByPublisher = async (publisherAddress: string): Promise<PlaygroundPayload[]> => {
  try {
    const records = await prisma.playground.findMany({
      where: { publisherAddress },
      orderBy: { createdAt: 'desc' },
    })

    const normalized = await Promise.all(
      records.map(async record => {
        const desiredResourcePath = `/playgrounds/${record.id}`
        if (record.resourcePath !== desiredResourcePath) {
          try {
            const updated = await prisma.playground.update({
              where: { id: record.id },
              data: { resourcePath: desiredResourcePath },
            })
            return updated
          } catch (error) {
            console.error('Failed to normalize playground resourcePath', { id: record.id, error })
          }
        }
        return record
      }),
    )

    return normalized
  } catch (error) {
    console.error('Failed to list playgrounds by publisher - database connection error:', error)
    return []
  }
}

export const parseMarkdownFrontMatter = async (markdown: string) => {
  const parsed = matter(markdown)
  return {
    frontMatter: parsed.data ?? {},
    content: parsed.content,
  }
}


