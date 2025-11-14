import React from 'react'
import { notFound } from 'next/navigation'

import { loadPlaygroundById, loadPlaygroundBySlug } from '@/lib/playgrounds'
import { PlaygroundViewer } from '@/components/playground-viewer'

// Helper function to extract tags from markdown
function extractTags(markdown: string): { mcp: string[]; tool: string[]; ai: string[]; define: string[] } {
  const agentDefineRegex = /^:::\s*\n([\s\S]*?)\n:::\s*$/i
  const tags = { mcp: [] as string[], tool: [] as string[], ai: [] as string[], define: [] as string[] }
  
  // Split markdown into blocks
  const lines = markdown.split('\n')
  const blocks: string[] = []
  let buffer: string[] = []
  let inCodeBlock = false
  
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      if (!inCodeBlock && buffer.length > 0) {
        blocks.push(buffer.join('\n'))
        buffer = []
      }
      continue
    }
    
    if (inCodeBlock) {
      buffer.push(line)
      continue
    }
    
    if (line.trim().startsWith(':::')) {
      if (buffer.length > 0) {
        blocks.push(buffer.join('\n'))
        buffer = []
      }
      buffer.push(line)
    } else if (buffer.length > 0) {
      buffer.push(line)
      if (line.trim().endsWith(':::')) {
        blocks.push(buffer.join('\n'))
        buffer = []
      }
    } else {
      blocks.push(line)
    }
  }
  
  if (buffer.length > 0) {
    blocks.push(buffer.join('\n'))
  }
  
  // Parse agent definition blocks
  blocks.forEach(block => {
    const match = agentDefineRegex.exec(block.trim())
    if (match) {
      const inner = match[1]
      const lines = inner.split('\n')
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('@')) {
          continue
        }
        
        const headerMatch = trimmed.match(/^@([^\[]+)\[([^\]]+)\]\(([^)]*)\)/)
        if (headerMatch) {
          const [, kindRaw, nameRaw] = headerMatch
          const kind = kindRaw.trim().toLowerCase()
          const name = nameRaw.trim()
          
          if (kind === 'mcp') {
            tags.mcp.push(name)
          } else if (kind === 'tool') {
            tags.tool.push(name)
          } else if (kind === 'ai') {
            tags.ai.push(name)
          } else if (kind === 'define') {
            tags.define.push(name)
          }
        }
      }
    }
  })
  
  return tags
}

type PlaygroundPageParams = {
  id: string
}

type PlaygroundPageProps = {
  params: Promise<PlaygroundPageParams>
}

export async function generateMetadata({ params }: PlaygroundPageProps) {
  const { id } = await params

  const playgroundById = await loadPlaygroundById(id)
  const playground = playgroundById ?? (await loadPlaygroundBySlug(id))
  if (!playground) {
    return {}
  }

  return {
    title: playground.title,
    description: playground.summary,
  }
}

export default async function PlaygroundDetailPage({ params }: PlaygroundPageProps) {
  const { id } = await params
  const playgroundById = await loadPlaygroundById(id)
  const playground = playgroundById ?? (await loadPlaygroundBySlug(id))

  if (!playground) {
    notFound()
  }

  const tags = extractTags(playground.markdown)
  const allTags = [
    ...tags.mcp.map(name => ({ type: 'mcp', name })),
    ...tags.tool.map(name => ({ type: 'tool', name })),
    ...tags.ai.map(name => ({ type: 'ai', name })),
    ...tags.define.map(name => ({ type: 'define', name })),
  ]

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pb-24 pt-12 sm:px-8 lg:px-0">
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag, index) => {
            const colorMap = {
              mcp: 'bg-blue-500/20 text-blue-200 border-blue-500/40',
              tool: 'bg-green-500/20 text-green-200 border-green-500/40',
              ai: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
              define: 'bg-orange-500/20 text-orange-200 border-orange-500/40',
            }
            return (
              <span
                key={`${tag.type}-${tag.name}-${index}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colorMap[tag.type as keyof typeof colorMap]}`}
              >
                <span className="text-[0.65rem] opacity-70">{tag.type}</span>
                <span>{tag.name}</span>
              </span>
            )
          })}
        </div>
      )}
      <section className="surface-panel prose prose-invert max-w-none p-8">
        <PlaygroundViewer 
          markdown={playground.markdown} 
          previews={
            playground.previews && typeof playground.previews === 'object' && !Array.isArray(playground.previews)
              ? (playground.previews as Record<string, string>)
              : {}
          } 
        />
      </section>
    </main>
  )
}
