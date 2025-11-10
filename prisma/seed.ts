import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()

const seedMarkdown = async (relativePath: string) => {
  const absolute = path.join(process.cwd(), relativePath)
  return fs.readFile(absolute, 'utf8')
}

async function main() {
  const examples = [
    {
      slug: 'portfolio-copilot',
      title: 'Portfolio Copilot',
      summary: 'Monitor your Solana positions and generate AI-native insights on demand.',
      markdownPath: 'playgrounds/portfolio-copilot.md',
      price: '$0.25',
      tags: ['defi', 'analytics', 'agents'],
      publisherAddress: '7n2ysD7ALZjB5aXG6qPiJxHFvP7A5UthsXxFvWSvZk2E',
    },
    {
      slug: 'nft-curator',
      title: 'NFT Curator',
      summary: 'Curate NFT drops with metadata enrichment and x402-enabled previews.',
      markdownPath: 'playgrounds/nft-curator.md',
      price: '$0.15',
      tags: ['nft', 'curation'],
      publisherAddress: 'BqYT7CvVWLSp9wNLaYv5VmWbsVg2nQb7HQRFuYrB6K6p',
    },
  ]

  for (const example of examples) {
    const markdown = await seedMarkdown(example.markdownPath)
    await prisma.playground.upsert({
      where: { slug: example.slug },
      update: {
        title: example.title,
        summary: example.summary,
        markdown,
        price: example.price,
        tags: example.tags,
        publisherAddress: example.publisherAddress,
        status: 'PUBLISHED',
        network: 'solana-devnet',
        resourcePath: `/playgrounds/${example.slug}`,
      },
      create: {
        slug: example.slug,
        title: example.title,
        summary: example.summary,
        markdown,
        price: example.price,
        tags: example.tags,
        publisherAddress: example.publisherAddress,
        status: 'PUBLISHED',
        network: 'solana-devnet',
        resourcePath: `/playgrounds/${example.slug}`,
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async error => {
    console.error('Failed to seed database', error)
    await prisma.$disconnect()
    process.exit(1)
  })


