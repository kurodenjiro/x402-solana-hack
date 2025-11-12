'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { PlaygroundPayload } from '@/lib/playgrounds'

type IntentState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  response?: string
  error?: string
}

type IntentTriggerPayload = {
  key: string
  agent: string
  prompt: string
}

type PlaygroundEditorProps = {
  initial?: Partial<PlaygroundPayload>
  onChange?: (payload: { markdown: string; blocks: string[] }) => void
}

const splitMarkdownBlocks = (markdown: string): string[] => {
  const lines = markdown.split('\n')
  const blocks: string[] = []
  let buffer: string[] = []
  let insideAgent = false

  const flush = () => {
    if (!buffer.length) {
      return
    }

    let result = buffer.join('\n')
    if (!insideAgent) {
      result = result.replace(/\n+$/g, '')
    }

    if (result.trim().length) {
      blocks.push(result)
    }

    buffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!insideAgent && trimmed === ':::') {
      flush()
      insideAgent = true
      buffer.push(':::')
      continue
    }

    if (insideAgent) {
      buffer.push(trimmed === ':::' ? ':::' : line)
      if (trimmed === ':::') {
        insideAgent = false
        flush()
      }
      continue
    }

    buffer.push(line)
    if (trimmed === '') {
      flush()
    }
  }

  flush()
  return blocks
}

const idleIntentState: IntentState = { status: 'idle' }

type IntentPreviewProps = {
  agent: string
  prompt: string
  displayPrompt: string
  buttonText: string
  intentKey: string
  state: IntentState
  onTrigger: (payload: IntentTriggerPayload) => void
}

const IntentPreview = ({ agent, prompt, displayPrompt, buttonText, intentKey, state, onTrigger }: IntentPreviewProps) => {
  const handleClick = () => {
    if (state.status === 'loading') {
      return
    }
    onTrigger({ key: intentKey, agent, prompt })
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={state.status === 'loading'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-6 py-3 text-sm font-semibold text-violet-100 transition hover:border-violet-400 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.status === 'loading' ? 'Running…' : buttonText}
      </button>
      {state.status === 'error' && state.error ? (
        <p className="text-xs text-rose-400">{state.error}</p>
      ) : null}
      {state.status === 'success' && state.response ? (
        <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-neutral-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {state.response}
          </ReactMarkdown>
        </div>
      ) : null}
    </div>
  )
}

const starterBlocks = [
  `::: 
@define[Wallet](3NAseqQ76ATx6E9iG8EztpGS1ofgt3URvGSZf965XLeA)

@mcp[SolanaMCP]("https://mcp.solana.com/mcp")
**Description:** Solana MCP service for protocol metadata, pricing, and account enrichment.

@tool[SolanaBalanceTool](address: String)
**Description:** get solana balance wallet

@ai[BalanceSummarizer]("gpt-4o-mini",[SolanaMCP,SolanaBalanceTool])
**Description:** Summarize risks and opportunities across holdings.

:::`,
  '# Portfolio Copilot',
  '> A markdown-native agent that reads on-chain data, builds reports, and suggests next actions.',
  '## 🧠 Capabilities',
  '- `@arg[Wallet]:String` (Primary wallet to analyze)',
  '- `@ai[BalanceSummarizer]("gpt-4o-mini",[SolanaMCP,SolanaBalanceTool])`',
  '- `@mcp[SolanaMCP]("https://mcp.solana.com/mcp")`',
  `## 🛠️ Workflow
1. Fetch balances for {Wallet}
2. Group positions by protocol
3. Generate recommendations via 

~ai[BalanceSummarizer]("
Summarize risks and opportunities for wallet {Wallet}.
Include:
- At-risk positions
- Suggested rebalancing moves
- Notable protocol exposure
")`,
  `~intent[BalanceSummarizer](<Summarize risks>,Summarize only the most at-risk positions for {Wallet} in one sentence.)`,
]

const aiSingleRegex = /~ai\[(.+?)\]\("([^"\n]+)"\)/g
const aiMultilineRegex = /~ai\[(.+?)\]\("\s*([\s\S]*?)\s*"\)/g
const intentRegex = /~intent\[(.+?)\]\(<([^>]+)>,\s*([\s\S]*?)\)/g
const agentDefineRegex = /^:::\s*\n([\s\S]*?)\n:::\s*$/i

type AiCall = {
  key: string
  agent: string
  prompt: string
  signature?: string
  tool?: {
    name: string
    params: string
  }
}

type AgentDefinition = {
  kind: string
  name: string
  params: string
  description?: string
  tool?: string
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const substituteDefinitions = (text: string, definitions: AgentDefinition[]) =>
  definitions.reduce((acc, definition) => {
    if (definition.kind.toLowerCase() !== 'define') {
      return acc
    }

    const replacement = definition.params.trim() || definition.name
    return acc.replace(new RegExp(`\\{${escapeRegExp(definition.name)}\\}`, 'g'), replacement)
  }, text)

const samplePreviewForAgent = (agent: string) => `🤖 ${agent.trim()}: thinking…`
const normalizePrompt = (prompt: string) => prompt.replace(/\r\n/g, '\n').trim()
const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const encodeDataAttribute = (value: string) => escapeAttribute(encodeURIComponent(value))
const decodeDataAttribute = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  try {
    return decodeURIComponent(value)
  } catch {
    return ''
  }
}

const getDataAttribute = (props: any, name: string) => {
  if (!props) {
    return undefined
  }
  const direct = props[name]
  if (direct !== undefined) {
    return Array.isArray(direct) ? direct[0] : direct
  }
  const nodeProps = props?.node?.properties
  if (nodeProps && nodeProps[name] !== undefined) {
    const value = nodeProps[name]
    return Array.isArray(value) ? value[0] : value
  }
  return undefined
}

const parseAgentDefinitionBlock = (block: string): AgentDefinition[] | null => {
  const match = agentDefineRegex.exec(block.trim())
  if (!match) {
    return null
  }

  const inner = match[1]
  const lines = inner.split('\n')
  const definitions: AgentDefinition[] = []

  let i = 0
  while (i < lines.length) {
    let line = lines[i]?.trim()
    if (!line) {
      i += 1
      continue
    }

    if (!line.startsWith('@')) {
      i += 1
      continue
    }

    const headerMatch = line.match(/^@([^\[]+)\[([^\]]+)\]\(([^)]*)\)/)
    if (!headerMatch) {
      i += 1
      continue
    }

    const [, kindRaw, nameRaw, paramsRaw] = headerMatch
    let description = ''
    let toolRef: string | undefined

    const inlineToolMatch = paramsRaw.match(/tool\s*:\s*\[([^\]]+)\]/i)
    if (inlineToolMatch) {
      toolRef = inlineToolMatch[1].trim()
    }

    i += 1
    while (i < lines.length) {
      const nextLine = lines[i]
      if (!nextLine || nextLine.trim().startsWith('@')) {
        break
      }

      const trimmed = nextLine.trim()
      if (!toolRef) {
        const toolMatch = trimmed.match(/^tool\s*:\s*\[([^\]]+)\]/i)
        if (toolMatch) {
          toolRef = toolMatch[1].trim()
          i += 1
          continue
        }
      }

      description += `${nextLine.trim()} `
      i += 1
    }

    description = description.replace(/\*\*Description:\*\*\s*/i, '').trim()

    definitions.push({
      kind: kindRaw.trim(),
      name: nameRaw.trim(),
      params: paramsRaw.trim(),
      description: description.length ? description : undefined,
      tool: toolRef,
    })
  }

  return definitions
}

const extractAiCalls = (block: string, index: number, definitions: AgentDefinition[]): AiCall[] => {
  const calls: AiCall[] = []

  if (parseAgentDefinitionBlock(block)) {
    return calls
  }

  const singleMatches = [...block.matchAll(aiSingleRegex)]
  singleMatches.forEach(match => {
    const [, agent, prompt] = match
    const promptWithDefinitions = substituteDefinitions(prompt, definitions)
    const promptKey = normalizePrompt(prompt)
    const aiDefinition = definitions.find(
      def => def.kind.toLowerCase() === 'ai' && def.name.toLowerCase() === agent.trim().toLowerCase(),
    )
    const toolDefinition = aiDefinition?.tool
      ? definitions.find(def => def.kind.toLowerCase() === 'tool' && def.name.toLowerCase() === aiDefinition.tool?.toLowerCase())
      : undefined

    calls.push({
      key: `${index}:${agent}:${promptKey}`,
      agent: agent.trim(),
      prompt: promptWithDefinitions,
      signature: aiDefinition?.params,
      tool: toolDefinition
        ? {
            name: toolDefinition.name,
            params: toolDefinition.params,
          }
        : undefined,
    })
  })

  const multilineMatches = [...block.matchAll(aiMultilineRegex)]
  multilineMatches.forEach(match => {
    const [, agent, prompt] = match
    const promptWithDefinitions = substituteDefinitions(prompt, definitions)
    const promptKey = normalizePrompt(prompt)
    const aiDefinition = definitions.find(
      def => def.kind.toLowerCase() === 'ai' && def.name.toLowerCase() === agent.trim().toLowerCase(),
    )
    const toolDefinition = aiDefinition?.tool
      ? definitions.find(def => def.kind.toLowerCase() === 'tool' && def.name.toLowerCase() === aiDefinition.tool?.toLowerCase())
      : undefined

    calls.push({
      key: `${index}:${agent}:${promptKey}`,
      agent: agent.trim(),
      prompt: promptWithDefinitions,
      signature: aiDefinition?.params,
      tool: toolDefinition
        ? {
            name: toolDefinition.name,
            params: toolDefinition.params,
          }
        : undefined,
    })
  })

  return calls
}

const replaceAiCalls = (
  block: string,
  index: number,
  previews: Record<string, string>,
  definitions: AgentDefinition[],
) => {
  if (parseAgentDefinitionBlock(block)) {
    return ''
  }

  let processedBlock = block

  const formatResponse = (agent: string, response: string) => {
    if (response.startsWith(`🤖 ${agent.trim()}:`)) {
      const content = response.slice(response.indexOf(':') + 1).trimStart()
      return `### ${agent.trim()}\n\n${content}`
    }
    return response
  }

  processedBlock = processedBlock.replace(aiSingleRegex, (_, agent: string, prompt: string) => {
    const key = `${index}:${agent}:${normalizePrompt(prompt)}`
    const output = previews[key] ?? samplePreviewForAgent(agent)
    return formatResponse(agent, output)
  })

  processedBlock = processedBlock.replace(aiMultilineRegex, (_, agent: string, prompt: string) => {
    const key = `${index}:${agent}:${normalizePrompt(prompt)}`
    const output = previews[key] ?? samplePreviewForAgent(agent)
    return formatResponse(agent, output)
  })

  processedBlock = processedBlock.replace(intentRegex, (_, agent: string, buttonText: string, prompt: string) => {
    const normalizedAgent = agent.trim()
    const normalizedButtonText = buttonText.trim()
    const normalizedPrompt = prompt.trim()
    const promptKey = normalizePrompt(normalizedPrompt)
    const key = `${index}:${normalizedAgent}:${promptKey}`
    const promptWithDefinitions = substituteDefinitions(normalizedPrompt, definitions)

    const keyAttr = encodeDataAttribute(key)
    const agentAttr = encodeDataAttribute(normalizedAgent)
    const buttonTextAttr = encodeDataAttribute(normalizedButtonText)
    const rawPromptAttr = encodeDataAttribute(normalizedPrompt)
    const renderedPromptAttr = encodeDataAttribute(promptWithDefinitions)

    return `\n<intent-button data-key="${keyAttr}" data-agent="${agentAttr}" data-button-text="${buttonTextAttr}" data-prompt="${rawPromptAttr}" data-rendered="${renderedPromptAttr}"></intent-button>\n`
  })

  return substituteDefinitions(processedBlock, definitions)
}

export const PlaygroundEditor = ({ initial, onChange }: PlaygroundEditorProps) => {
  const [markdown, setMarkdown] = useState(initial?.markdown ?? starterBlocks.join('\n\n'))
  const blockList = useMemo(() => splitMarkdownBlocks(markdown), [markdown])
  const agentDefinitions = useMemo(() => {
    const definitions = blockList
      .map(block => parseAgentDefinitionBlock(block))
      .filter((def): def is AgentDefinition[] => Boolean(def))
      .flat()
    return definitions
  }, [blockList])
  const mcpDefinitions = useMemo(
    () => agentDefinitions.filter(def => def.kind.toLowerCase() === 'mcp'),
    [agentDefinitions],
  )
  const blockEntries = useMemo(() => {
    const entries: { block: string; index: number }[] = []
    blockList.forEach((block, index) => {
      if (!parseAgentDefinitionBlock(block)) {
        entries.push({ block, index })
      }
    })
    return entries
  }, [blockList])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({})
  const previewRef = useRef<Record<string, string>>({})
  const [intentStates, setIntentStates] = useState<Record<string, IntentState>>({})

  const resetPreviews = useCallback(() => {
    previewRef.current = {}
    setPreviewMap({})
    setIntentStates({})
  }, [])

  const handleIntentTrigger = useCallback(
    async ({ key, agent, prompt }: IntentTriggerPayload) => {
      const aiDefinition = agentDefinitions.find(
        def => def.kind.toLowerCase() === 'ai' && def.name.toLowerCase() === agent.trim().toLowerCase(),
      )
      const toolDefinition = aiDefinition?.tool
        ? agentDefinitions.find(
            def => def.kind.toLowerCase() === 'tool' && def.name.toLowerCase() === aiDefinition.tool?.toLowerCase(),
          )
        : undefined

      const config =
        aiDefinition || toolDefinition
          ? {
              signature: aiDefinition?.params,
              tool: toolDefinition
                ? {
                    name: toolDefinition.name,
                    params: toolDefinition.params,
                  }
                : undefined,
            }
          : undefined

      const promptWithDefinitions = substituteDefinitions(prompt, agentDefinitions)

      setIntentStates(prev => ({
        ...prev,
        [key]: { status: 'loading' },
      }))

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'text',
            bot: agent,
            prompt: promptWithDefinitions,
            ...(config ? { config } : {}),
            ...(mcpDefinitions.length
              ? { mcp: mcpDefinitions.map(definition => ({ name: definition.name, params: definition.params })) }
              : {}),
          }),
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload: { content?: string } = await response.json()
        const content = payload.content?.trim() ?? ''

        setIntentStates(prev => ({
          ...prev,
          [key]: {
            status: content.length ? 'success' : 'error',
            response: content.length ? content : undefined,
            error: content.length ? undefined : 'No response content',
          },
        }))
      } catch (error) {
        setIntentStates(prev => ({
          ...prev,
          [key]: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to run intent.',
          },
        }))
      }
    },
    [agentDefinitions, mcpDefinitions],
  )

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

      resetPreviews()
      const nextMarkdown = nextBlocks.join('\n\n')
      setMarkdown(nextMarkdown)
      setDragIndex(null)
      onChange?.({ markdown: nextMarkdown, blocks: nextBlocks })
    },
    [dragIndex, blockList, onChange, resetPreviews],
  )

  const handleMarkdownChange = useCallback(
    (value: string) => {
      resetPreviews()
      setMarkdown(value)
      onChange?.({ markdown: value, blocks: splitMarkdownBlocks(value) })
    },
    [onChange, resetPreviews],
  )

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const pending: AiCall[] = []

      blockList.forEach((block, index) => {
        extractAiCalls(block, index, agentDefinitions).forEach(call => {
          if (!previewRef.current[call.key]) {
            const placeholder = samplePreviewForAgent(call.agent)
            previewRef.current[call.key] = placeholder
            setPreviewMap(prev => ({ ...prev, [call.key]: placeholder }))
            pending.push(call)
          }
        })
      })

      if (!pending.length) {
        return
      }

      for (const call of pending) {
        try {
          const config =
            call.signature || call.tool
              ? {
                  signature: call.signature,
                  tool: call.tool,
                }
              : undefined

          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'text',
              bot: call.agent,
              prompt: call.prompt,
              ...(config ? { config } : {}),
              ...(mcpDefinitions.length
                ? { mcp: mcpDefinitions.map(definition => ({ name: definition.name, params: definition.params })) }
                : {}),
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
  }, [agentDefinitions, blockList])

  return (
    <section className="flex flex-col gap-4 p-6 lg:p-8">
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
            {blockEntries.map(({ block, index }) => (
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
                    rehypePlugins={[rehypeRaw]}
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
                        p({ node, children, ...props }: any) {
                          const hasIntentButton = Array.isArray(node?.children)
                            ? node.children.some((child: any) => child?.tagName === 'intent-button')
                            : false
                          if (hasIntentButton) {
                            const { className, ...rest } = props
                            return (
                              <div {...rest} className={className}>
                                {children}
                              </div>
                            )
                          }
                          return (
                            <p {...props}>
                              {children}
                            </p>
                          )
                        },
                        ['intent-button']: (props: any) => {
                          const keyAttr = decodeDataAttribute(getDataAttribute(props, 'data-key'))
                          const agentAttr = decodeDataAttribute(getDataAttribute(props, 'data-agent')) || 'Intent'
                          const buttonTextAttr = decodeDataAttribute(getDataAttribute(props, 'data-button-text')) || 'Run intent'
                          const rawPromptAttr = decodeDataAttribute(getDataAttribute(props, 'data-prompt'))
                          const renderedPromptAttr = decodeDataAttribute(getDataAttribute(props, 'data-rendered')) || rawPromptAttr
                          const state = intentStates[keyAttr] ?? idleIntentState

                          return (
                            <IntentPreview
                              key={keyAttr}
                              agent={agentAttr}
                              prompt={rawPromptAttr}
                              displayPrompt={renderedPromptAttr}
                              buttonText={buttonTextAttr}
                              intentKey={keyAttr}
                              state={state}
                              onTrigger={handleIntentTrigger}
                            />
                          )
                        },
                      } as Components
                    }
                  >
                    {replaceAiCalls(block, index, previewMap, agentDefinitions)}
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
            rows={35}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-neutral-100 focus:border-violet-400 focus:outline-none"
          />
        </div>
      </div>
    </section>
  )
}

