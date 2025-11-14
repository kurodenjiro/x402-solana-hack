import React from 'react'
import { notFound } from 'next/navigation'

import { loadPlaygroundById, loadPlaygroundBySlug } from '@/lib/playgrounds'
import { PlaygroundViewer } from '@/components/playground-viewer'

// Helper function to extract tags from markdown
function extractTags(markdown: string): { mcp: string[]; tool: string[]; ai: string[]; define: string[] } {
  const agentDefineRegex = /^:::\s*\n([\s\S]*?)\n:::\s*$/i
  const tags = { mcp: [] as string[], tool: [] as string[], ai: [] as string[], define: [] as string[] }
  
  // Split markdown into blocks (simplified version)
  const lines = markdown.split('\n')
  const blocks: string[] = []
  let buffer: string[] = []
  let insideAgent = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === ':::') {
      if (insideAgent) {
        buffer.push(line)
        blocks.push(buffer.join('\n'))
        buffer = []
        insideAgent = false
      } else {
        if (buffer.length > 0) {
          blocks.push(buffer.join('\n'))
          buffer = []
        }
        buffer.push(line)
        insideAgent = true
      }
    } else if (insideAgent) {
      buffer.push(line)
    } else {
      if (buffer.length > 0) {
        blocks.push(buffer.join('\n'))
        buffer = []
      }
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
      const innerLines = inner.split('\n')
      
      for (const line of innerLines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('@')) {
          continue
        }
        
        const headerMatch = trimmed.match(/^@([^\[]+)\[([^\]]+)\]\(([^)]*)\)/)
        if (headerMatch) {
          const [, kindRaw, nameRaw] = headerMatch
          const kind = kindRaw.trim().toLowerCase()
          const name = nameRaw.trim()
          
          if (kind === 'mcp' && !tags.mcp.includes(name)) {
            tags.mcp.push(name)
          } else if (kind === 'tool' && !tags.tool.includes(name)) {
            tags.tool.push(name)
          } else if (kind === 'ai' && !tags.ai.includes(name)) {
            tags.ai.push(name)
          } else if (kind === 'define' && !tags.define.includes(name)) {
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
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {allTags.map((tag, index) => {
            const colorMap = {
              mcp: {
                bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
                text: 'text-blue-100',
                border: 'border-blue-400/50',
                badge: 'bg-blue-500/30 text-blue-200',
                icon: '🔌',
              },
              tool: {
                bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20',
                text: 'text-emerald-100',
                border: 'border-emerald-400/50',
                badge: 'bg-emerald-500/30 text-emerald-200',
                icon: '🛠️',
              },
              ai: {
                bg: 'bg-gradient-to-r from-violet-500/20 to-purple-500/20',
                text: 'text-violet-100',
                border: 'border-violet-400/50',
                badge: 'bg-violet-500/30 text-violet-200',
                icon: '🤖',
              },
              define: {
                bg: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20',
                text: 'text-amber-100',
                border: 'border-amber-400/50',
                badge: 'bg-amber-500/30 text-amber-200',
                icon: '📝',
              },
            }
            const colors = colorMap[tag.type as keyof typeof colorMap]
            return (
              <span
                key={`${tag.type}-${tag.name}-${index}`}
                className={`group inline-flex items-center gap-2 rounded-xl border backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg ${colors.bg} ${colors.border} ${colors.text} px-4 py-2.5`}
              >
                <span className="text-base">{colors.icon}</span>
                <span className="text-[0.7rem] font-bold uppercase tracking-widest opacity-80">{tag.type}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50"></span>
                <span className="font-semibold">{tag.name}</span>
              </span>
            )
          })}
        </div>
      )}
    </main>
  )
}
