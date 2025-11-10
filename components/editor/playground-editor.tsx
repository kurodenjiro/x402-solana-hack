'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { PlaygroundPayload } from '@/lib/playgrounds'

type PlaygroundEditorProps = {
  initial?: Partial<PlaygroundPayload>
  onChange?: (payload: { markdown: string; blocks: string[] }) => void
}

const starterBlocks = [
  '# Title',
  '## Problem',
  'Describe the pain point your agent solves.',
  '## Workflow',
  '1. Step one\n2. Step two',
  '## AI Behaviors',
  '~ai[Summarizer]("Explain risks for {Wallet}")\n~ai[Summarizer]("Balance of {Wallet}")\n\n~ai[IntentClassifier]("""\nPick a persona for {Wallet}:\n- INVESTOR\n- DEX_USER\n- NFT_WHALE\n""")',
  '## Monetization',
  'Explain what x402 unlocks for paying users.',
]

const aiSingleRegex = /~ai\[(.+?)\]\("([^"]+)"\)/g
const aiTripleRegex = /~ai\[(.+?)\]\("""([\s\S]*?)"""\)/g

type AiCall = {
  key: string
  agent: string
  prompt: string
}

const extractAiCalls = (block: string, index: number): AiCall[] => {
  const calls: AiCall[] = []

  const singleMatches = [...block.matchAll(aiSingleRegex)]
  singleMatches.forEach(match => {
    const [, agent, prompt] = match
    calls.push({
      key: `${index}:${agent}:${prompt}`,
      agent: agent.trim(),
      prompt,
    })
  })

  const tripleMatches = [...block.matchAll(aiTripleRegex)]
  tripleMatches.forEach(match => {
    const [, agent, prompt] = match
    calls.push({
      key: `${index}:${agent}:${prompt}`,
      agent: agent.trim(),
      prompt,
    })
  })

  return calls
}

const replaceAiCalls = (block: string, index: number, previews: Record<string, string>) => {
  const replaceSingle = block.replace(aiSingleRegex, (_, agent: string, prompt: string) => {
    const key = `${index}:${agent}:${prompt}`
    return previews[key] ?? `🤖 ${agent.trim()} is thinking…`
  })

  const replaceTriple = replaceSingle.replace(aiTripleRegex, (_, agent: string, prompt: string) => {
    const key = `${index}:${agent}:${prompt}`
    return previews[key] ?? `🤖 ${agent.trim()} is thinking…`
  })

  return replaceTriple
}

export const PlaygroundEditor = ({ initial, onChange }: PlaygroundEditorProps) => {
  const [markdown, setMarkdown] = useState(initial?.markdown ?? starterBlocks.join('\n\n'))
  const blockList = useMemo(() => markdown.split('\n\n'), [markdown])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({})
  const previewRef = useRef<Record<string, string>>({})

  const handleBlockDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleBlockDrop = useCallback(
    (index: number) => {
      if (dragIndex === null || dragIndex === index) {
        setDragIndex(null)
        return
      }

      const nextBlocks = [...blockList]
      const [removed] = nextBlocks.splice(dragIndex, 1)
      nextBlocks.splice(index, 0, removed)

      const nextMarkdown = nextBlocks.join('\n\n')
      setMarkdown(nextMarkdown)
      setDragIndex(null)
      onChange?.({ markdown: nextMarkdown, blocks: nextBlocks })
    },
    [dragIndex, blockList, onChange],
  )

  const handleMarkdownChange = useCallback(
    (value: string) => {
      setMarkdown(value)
      onChange?.({ markdown: value, blocks: value.split('\n\n') })
    },
    [onChange],
  )

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const pending: AiCall[] = []

      blockList.forEach((block, index) => {
        extractAiCalls(block, index).forEach(call => {
          if (!previewRef.current[call.key]) {
            pending.push(call)
          }
        })
      })

      if (!pending.length) {
        return
      }

      for (const call of pending) {
        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'text',
              bot: call.agent,
              prompt: call.prompt,
            }),
          })

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`)
          }

          const payload: { content?: string } = await response.json()
          const content = payload.content?.trim()
            ? `🤖 ${call.agent}: ${payload.content.trim()}`
            : `🤖 ${call.agent}: (no response)`

          if (!cancelled) {
            setPreviewMap(prev => {
              const next = { ...prev, [call.key]: content }
              previewRef.current = next
              return next
            })
          }
        } catch (error) {
          if (!cancelled) {
            setPreviewMap(prev => {
              const next = { ...prev, [call.key]: `⚠️ ${call.agent}: unable to generate preview` }
              previewRef.current = next
              return next
            })
          }
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [blockList])

  return (
    <section className="surface-panel flex flex-col gap-4 p-6 lg:p-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Playground editor</h2>
          <p className="text-sm text-neutral-400">
            Drag blocks to reorganize sections, or edit the raw Markdown to unlock full control.
          </p>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-neutral-400">Blocks</h3>
          <ul className="space-y-3">
            {blockList.map((block, index) => (
              <li
                key={`${block}-${index}`}
                draggable
                onDragStart={() => handleBlockDragStart(index)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => handleBlockDrop(index)}
                className="cursor-move rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 px-3 py-3 text-sm text-neutral-200 transition hover:border-violet-400/60"
              >
                <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-neutral-200 prose-strong:text-white prose-li:text-neutral-200">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={
                      {
                        code({ inline, children, ...props }: any) {
                          if (inline) {
                            return (
                              <code className="font-mono text-xs text-violet-200" {...props}>
                                {children}
                              </code>
                            )
                          }

                          return (
                            <code
                              className="block whitespace-pre-wrap rounded-md bg-black/40 p-3 font-mono text-xs text-neutral-100"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                      } satisfies Components
                    }
                  >
                    {replaceAiCalls(block, index, previewMap)}
                  </ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-neutral-400">Markdown</h3>
          <textarea
            value={markdown}
            onChange={event => handleMarkdownChange(event.target.value)}
            rows={20}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-neutral-100 focus:border-violet-400 focus:outline-none"
          />
        </div>
      </div>
    </section>
  )
}

