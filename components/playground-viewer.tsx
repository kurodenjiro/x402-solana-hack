'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'

// Import regex patterns and helper functions from the editor
const aiTripleQuoteRegex = /~ai\[(.+?)\]\(\s*"""\s*([\s\S]*?)\s*"""\s*\)/g
const aiMultilineRegex = /~ai\[(.+?)\]\(\s*(?!""")([\s\S]*?)\s*\)/g
const aiSingleRegex = /~ai\[(.+?)\]\(([^)\n]+)\)/g
const aiImageRegex = /~ai-image\[(.+?)\]\(([^)]+)\)/g
const aiSpeechRegex = /~ai-speech\[(.+?)\]\(([^)]+)\)/g
const defineRegex = /~define\[(.+?)\]\(([^)]+)\)/g
const intentRegex = /~intent\[(.+?)\]\(<([^>]+)>,\s*([\s\S]*?)\)/g
const agentDefineRegex = /^:::\s*\n([\s\S]*?)\n:::\s*$/i

const normalizePrompt = (prompt: string) => prompt.replace(/\r\n/g, '\n').trim()

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const splitMarkdownBlocks = (markdown: string): string[] => {
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
    } else {
      buffer.push(line)
      if (!insideAgent && trimmed === '') {
        if (buffer.length > 1) {
          blocks.push(buffer.slice(0, -1).join('\n'))
          buffer = [buffer[buffer.length - 1]]
        }
      }
    }
  }

  if (buffer.length > 0) {
    blocks.push(buffer.join('\n'))
  }

  return blocks.filter(block => block.trim().length > 0)
}

const parseAgentDefinitionBlock = (block: string): boolean => {
  return agentDefineRegex.test(block.trim())
}

// Extract default values from @define in agent definition blocks
const extractDefineDefaults = (markdown: string): Record<string, string> => {
  const defaults: Record<string, string> = {}
  const blocks = splitMarkdownBlocks(markdown)
  
  blocks.forEach((block, index) => {
    if (parseAgentDefinitionBlock(block)) {
      // Extract @define[Name](defaultValue) from agent definition block
      const defineMatches = [...block.matchAll(/@define\[([^\]]+)\]\(([^)]+)\)/g)]
      defineMatches.forEach(match => {
        const [, name, defaultValue] = match
        const normalizedName = name.trim()
        // Store by name (without index) so it can be matched later
        defaults[normalizedName] = defaultValue.trim()
      })
    }
  })
  
  return defaults
}

const formatResponse = (agent: string, response: string) => {
  const thinkingPattern = `🤖 ${agent.trim()}: thinking…`
  if (response === thinkingPattern || response === `🤖 **${agent.trim()}**: thinking…`) {
    return `🤖 **${agent.trim()}**: thinking…`
  }
  if (response.startsWith('⚠️')) {
    return response
  }
  if (response && response !== thinkingPattern) {
    return response
  }
  return `🤖 **${agent.trim()}**: thinking…`
}

const processBlock = (block: string, index: number, previews: Record<string, string>): string => {
  // Skip agent definition blocks
  if (parseAgentDefinitionBlock(block)) {
    return ''
  }

  let processedBlock = block
  const processedKeys = new Set<string>()

  // Process triple-quoted strings
  const tripleQuoteMatches = [...processedBlock.matchAll(aiTripleQuoteRegex)]
  tripleQuoteMatches.forEach(match => {
    const [fullMatch, agent, prompt] = match
    const normalizedPrompt = normalizePrompt(prompt)
    const key = `${index}:${agent.trim()}:${normalizedPrompt}`
    if (!processedKeys.has(key)) {
      processedKeys.add(key)
      const output = previews[key]
      if (output) {
        processedBlock = processedBlock.replace(fullMatch, formatResponse(agent, output))
      } else {
        processedBlock = processedBlock.replace(fullMatch, formatResponse(agent, `🤖 ${agent.trim()}: thinking…`))
      }
    }
  })

  // Process unquoted multiline
  const multilineMatches = [...processedBlock.matchAll(aiMultilineRegex)]
  multilineMatches.forEach(match => {
    const [fullMatch, agent, prompt] = match
    const key = `${index}:${agent.trim()}:${normalizePrompt(prompt)}`
    if (!processedKeys.has(key)) {
      processedKeys.add(key)
      const output = previews[key]
      if (output) {
        processedBlock = processedBlock.replace(fullMatch, formatResponse(agent, output))
      } else {
        processedBlock = processedBlock.replace(fullMatch, formatResponse(agent, `🤖 ${agent.trim()}: thinking…`))
      }
    }
  })

  // Process single line
  processedBlock = processedBlock.replace(aiSingleRegex, (match, agent: string, prompt: string) => {
    const key = `${index}:${agent.trim()}:${normalizePrompt(prompt)}`
    if (processedKeys.has(key)) {
      return match
    }
    const output = previews[key]
    if (output) {
      return formatResponse(agent, output)
    } else {
      return formatResponse(agent, `🤖 ${agent.trim()}: thinking…`)
    }
  })

  // Process images
  processedBlock = processedBlock.replace(aiImageRegex, (_, agent: string, prompt: string) => {
    const key = `image:${index}:${agent}:${normalizePrompt(prompt)}`
    const output = previews[key]
    console.log(`[PlaygroundViewer] Image lookup - key: "${key}", found: ${!!output}, isUrl: ${output?.startsWith('/api/media')}, isDataUrl: ${output?.startsWith('data:image')}`)
    // Check if it's a URL or data URL
    const isUrl = output && typeof output === 'string' && output.startsWith('/api/media')
    const isDataUrl = output && typeof output === 'string' && output.startsWith('data:image') && output.length > 100
    if (isUrl || isDataUrl) {
      return `\n![Generated by ${agent}](${output})\n`
    }
    return `\n🖼️ **${agent}**: generating image...\n`
  })

  // Process speech - use custom element like in editor
  processedBlock = processedBlock.replace(aiSpeechRegex, (_, agent: string, prompt: string) => {
    const key = `speech:${index}:${agent}:${normalizePrompt(prompt)}`
    const output = previews[key]
    console.log(`[PlaygroundViewer] Speech lookup - key: "${key}", found: ${!!output}, isUrl: ${output?.startsWith('/api/media')}, isDataUrl: ${output?.startsWith('data:audio')}`)
    // Check if it's a URL or data URL
    const isUrl = output && typeof output === 'string' && output.startsWith('/api/media')
    const isDataUrl = output && typeof output === 'string' && (output.startsWith('data:audio') || output.startsWith('data:audio/')) && output.length > 100
    if (isUrl || isDataUrl) {
      const keyAttr = encodeDataAttribute(key)
      const agentAttr = encodeDataAttribute(agent.trim())
      const audioDataAttr = encodeDataAttribute(output)
      return `\n<ai-speech data-key="${keyAttr}" data-agent="${agentAttr}" data-audio="${audioDataAttr}"></ai-speech>\n`
    }
    return `\n🎤 **${agent}**: generating speech...\n`
  })

  // Keep define inputs and intent buttons - they'll be rendered as custom components
  // We'll replace them with custom HTML elements that ReactMarkdown will handle

  return processedBlock
}

type PlaygroundViewerProps = {
  markdown: string
  previews?: Record<string, string> | null
}

const encodeDataAttribute = (value: string) => {
  return encodeURIComponent(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

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

// Parse agent definitions from markdown
const parseAgentDefinitions = (markdown: string): Array<{ kind: string; name: string; params: string }> => {
  const definitions: Array<{ kind: string; name: string; params: string }> = []
  const blocks = splitMarkdownBlocks(markdown)
  
  blocks.forEach(block => {
    if (parseAgentDefinitionBlock(block)) {
      const match = agentDefineRegex.exec(block.trim())
      if (match) {
        const inner = match[1]
        const lines = inner.split('\n')
        
        let i = 0
        while (i < lines.length) {
          const line = lines[i]?.trim()
          if (!line || !line.startsWith('@')) {
            i += 1
            continue
          }
          
          const headerMatch = line.match(/^@([^\[]+)\[([^\]]+)\]\(([^)]*)\)/)
          if (headerMatch) {
            const [, kindRaw, nameRaw, paramsRaw] = headerMatch
            definitions.push({
              kind: kindRaw.trim(),
              name: nameRaw.trim(),
              params: paramsRaw.trim(),
            })
          }
          i += 1
        }
      }
    }
  })
  
  return definitions
}

export const PlaygroundViewer = ({ markdown, previews = {} }: PlaygroundViewerProps) => {
  // Extract default values from @define in agent definition blocks
  const defineDefaults = useMemo(() => extractDefineDefaults(markdown), [markdown])
  
  // Parse agent definitions for AI generation
  const agentDefinitions = useMemo(() => parseAgentDefinitions(markdown), [markdown])
  
  // Extract MCP definitions
  const mcpDefinitions = useMemo(
    () => agentDefinitions.filter(def => def.kind.toLowerCase() === 'mcp'),
    [agentDefinitions],
  )
  
  // Extract define calls to build defineNameMap
  const blocks = useMemo(() => splitMarkdownBlocks(markdown), [markdown])
  const defineCalls = useMemo(() => {
    const defines: Array<{ key: string; name: string }> = []
    blocks.forEach((block, index) => {
      const matches = [...block.matchAll(defineRegex)]
      matches.forEach(match => {
        const [, name] = match
        const key = `define:${index}:${name.trim()}`
        defines.push({ key, name: name.trim() })
      })
    })
    return defines
  }, [blocks])
  
  const defineNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    defineCalls.forEach(({ key, name }) => {
      map[key] = name
    })
    return map
  }, [defineCalls])
  
  // Debug: Log previews on mount to verify they're being passed correctly
  useEffect(() => {
    if (Object.keys(previews || {}).length > 0) {
      console.log('[PlaygroundViewer] Loaded with previews:', {
        total: Object.keys(previews || {}).length,
        imageKeys: Object.keys(previews || {}).filter(k => k.startsWith('image:')),
        speechKeys: Object.keys(previews || {}).filter(k => k.startsWith('speech:')),
        samplePreviews: Object.entries(previews || {}).slice(0, 3).map(([k, v]) => ({ 
          key: k, 
          value: typeof v === 'string' ? (v.startsWith('/api/media') ? v : v.substring(0, 50) + '...') : v 
        }))
      })
    }
    console.log('[PlaygroundViewer] Define defaults:', defineDefaults)
  }, [previews, defineDefaults])

  // Use saved previews as initial state, but allow updates for regeneration
  const [previewMap, setPreviewMap] = useState<Record<string, string>>(previews || {})
  const [intentStates, setIntentStates] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'error'; response?: string; error?: string }>>({})
  const [userDefines, setUserDefines] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)

  // Substitute definitions in prompts (similar to editor)
  const substituteDefinitions = useCallback((
    text: string,
    userDefines: Record<string, string>,
    defineNameMap: Record<string, string>,
    defineDefaults: Record<string, string>,
  ) => {
    let result = text

    // First, substitute user-defined values (they take priority)
    result = result.replace(/\{([^}]+)\}/g, (match, varName) => {
      // Find the define key for this variable name
      const defineKey = Object.keys(defineNameMap).find(key => defineNameMap[key] === varName)
      if (defineKey && userDefines[defineKey]) {
        return userDefines[defineKey]
      }
      // Fallback to default value from agent definitions
      if (defineDefaults[varName]) {
        return defineDefaults[varName]
      }
      return match
    })

    return result
  }, [])

  const handleIntentTrigger = useCallback(async (key: string, agent: string, prompt: string) => {
    setIntentStates(prev => ({ ...prev, [key]: { status: 'loading' } }))
    
    try {
      // Substitute variables in prompt
      const promptWithSubs = substituteDefinitions(prompt, userDefines, defineNameMap, defineDefaults)
      
      // Find agent definition for config
      const aiDefinition = agentDefinitions.find(
        def => def.kind.toLowerCase() === 'ai' && def.name.toLowerCase() === agent.toLowerCase()
      )
      // Extract tool reference from AI definition params (e.g., "gpt-4o-mini,[SolanaMCP,SolanaBalanceTool]")
      const toolRef = aiDefinition?.params?.match(/\[([^\]]+)\]/)?.[1]
      const toolDefinition = toolRef
        ? agentDefinitions.find(
            def => def.kind.toLowerCase() === 'tool' && toolRef.includes(def.name)
          )
        : undefined
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          bot: agent,
          prompt: promptWithSubs,
          config: aiDefinition || toolDefinition
            ? {
                signature: aiDefinition?.params,
                tool: toolDefinition
                  ? {
                      name: toolDefinition.name,
                      params: toolDefinition.params,
                    }
                  : undefined,
              }
            : undefined,
          ...(mcpDefinitions.length
            ? { mcp: mcpDefinitions.map(def => ({ name: def.name, params: def.params })) }
            : {}),
        }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const payload: { content?: string; error?: string } = await response.json()
      
      if (payload.error) {
        setIntentStates(prev => ({ ...prev, [key]: { status: 'error', error: payload.error } }))
      } else {
        const content = payload.content?.trim() || '(no response)'
        setIntentStates(prev => ({ ...prev, [key]: { status: 'success', response: content } }))
      }
    } catch (error) {
      setIntentStates(prev => ({ 
        ...prev, 
        [key]: { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Failed to generate response' 
        } 
      }))
    }
  }, [userDefines, defineNameMap, defineDefaults, agentDefinitions, substituteDefinitions, mcpDefinitions])

  const handleDefineChange = useCallback((key: string, value: string) => {
    setUserDefines(prev => {
      const updated = { ...prev, [key]: value }
      // Get the variable name for this define key
      const varName = defineNameMap[key]
      if (varName) {
        // Find all AI calls that use this variable and regenerate them
        const varPattern = new RegExp(`\\{${escapeRegExp(varName)}\\}`)
        const blocksToRegenerate: Array<{ blockIndex: number; callType: 'text' | 'image' | 'speech'; agent: string; prompt: string; key: string }> = []
        
        blocks.forEach((block, blockIndex) => {
          if (parseAgentDefinitionBlock(block)) {
            return
          }
          
          // Check all AI call patterns
          const allMatches = [
            ...block.matchAll(aiTripleQuoteRegex),
            ...block.matchAll(aiSingleRegex),
            ...block.matchAll(aiMultilineRegex),
            ...block.matchAll(aiImageRegex),
            ...block.matchAll(aiSpeechRegex),
          ]
          
          for (const match of allMatches) {
            const [, agent, prompt] = match
            if (varPattern.test(prompt)) {
              const promptKey = normalizePrompt(prompt)
              const callType = match[0].includes('~ai-image') ? 'image' : match[0].includes('~ai-speech') ? 'speech' : 'text'
              const callKey = callType === 'image' 
                ? `image:${blockIndex}:${agent.trim()}:${promptKey}`
                : callType === 'speech'
                ? `speech:${blockIndex}:${agent.trim()}:${promptKey}`
                : `${blockIndex}:${agent.trim()}:${promptKey}`
              
              blocksToRegenerate.push({
                blockIndex,
                callType,
                agent: agent.trim(),
                prompt: prompt.trim(),
                key: callKey,
              })
            }
          }
        })
        
        // Clear previews for affected calls and set "thinking..." placeholders
        setPreviewMap(prevMap => {
          const newMap = { ...prevMap }
          blocksToRegenerate.forEach(({ key: callKey, agent }) => {
            // Set thinking placeholder so UI shows loading state
            newMap[callKey] = `🤖 ${agent}: thinking…`
          })
          return newMap
        })
        
        // Regenerate affected calls
        if (blocksToRegenerate.length > 0) {
          setIsGenerating(true)
          
          // Generate all affected calls
          Promise.all(blocksToRegenerate.map(async ({ callType, agent, prompt, key: callKey }) => {
            try {
              // Substitute variables in prompt
              const promptWithSubs = substituteDefinitions(prompt, updated, defineNameMap, defineDefaults)
              
              // Find agent definition for config
              const aiDefinition = agentDefinitions.find(
                def => def.kind.toLowerCase() === 'ai' && def.name.toLowerCase() === agent.toLowerCase()
              )
              // Extract tool reference from AI definition params (e.g., "gpt-4o-mini,[SolanaMCP,SolanaBalanceTool]")
              const toolRef = aiDefinition?.params?.match(/\[([^\]]+)\]/)?.[1]
              const toolDefinition = toolRef
                ? agentDefinitions.find(
                    def => def.kind.toLowerCase() === 'tool' && toolRef.includes(def.name)
                  )
                : undefined
              
              const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: callType,
                  bot: agent,
                  prompt: promptWithSubs,
                  key: callKey,
                  config: aiDefinition || toolDefinition
                    ? {
                        signature: aiDefinition?.params,
                        tool: toolDefinition
                          ? {
                              name: toolDefinition.name,
                              params: toolDefinition.params,
                            }
                          : undefined,
                      }
                    : undefined,
                  ...(mcpDefinitions.length
                    ? { mcp: mcpDefinitions.map(def => ({ name: def.name, params: def.params })) }
                    : {}),
                }),
              })
              
              if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
              }
              
              const payload = await response.json()
              
              if (callType === 'image') {
                const imageData = payload.image
                if (imageData && typeof imageData === 'string') {
                  setPreviewMap(prev => ({ ...prev, [callKey]: imageData }))
                }
              } else if (callType === 'speech') {
                const audioData = payload.audio
                if (audioData && typeof audioData === 'string') {
                  setPreviewMap(prev => ({ ...prev, [callKey]: audioData }))
                }
              } else {
                const content = payload.content
                if (content && typeof content === 'string') {
                  // Store content without bot name prefix (formatResponse will add it)
                  setPreviewMap(prev => ({ ...prev, [callKey]: content.trim() }))
                } else if (payload.error) {
                  setPreviewMap(prev => ({ 
                    ...prev, 
                    [callKey]: `⚠️ ${agent}: ${payload.error}` 
                  }))
                }
              }
            } catch (error) {
              console.error(`[PlaygroundViewer] Failed to regenerate ${callType} for ${callKey}:`, error)
              setPreviewMap(prev => ({ 
                ...prev, 
                [callKey]: `⚠️ ${agent}: ${error instanceof Error ? error.message : 'Failed to generate'}` 
              }))
            }
          })).finally(() => {
            setIsGenerating(false)
          })
        }
      }
      return updated
    })
  }, [blocks, defineNameMap, agentDefinitions, substituteDefinitions, defineDefaults, mcpDefinitions])

  const processBlockWithDefines = (block: string, index: number, previews: Record<string, string>, userDefines: Record<string, string>, defineDefaults: Record<string, string>): string => {
    // Use previewMap (which includes regenerated previews) instead of just saved previews
    const allPreviews = { ...previews, ...previewMap }
    let processed = processBlock(block, index, allPreviews)
    
    // Process define inputs - replace with custom HTML element
    processed = processed.replace(defineRegex, (_, name: string, label: string) => {
      const key = `define:${index}:${name}`
      const normalizedName = name.trim()
      // Get default value from agent definitions (extracted from @define in ::: block)
      const defaultValue = defineDefaults[normalizedName] || ''
      const currentValue = userDefines[key] || defaultValue
      const keyAttr = encodeDataAttribute(key)
      const nameAttr = encodeDataAttribute(name.trim())
      const labelAttr = encodeDataAttribute(label.trim())
      const defaultValueAttr = encodeDataAttribute(defaultValue)
      const currentValueAttr = encodeDataAttribute(currentValue)
      return `\n<define-input data-key="${keyAttr}" data-name="${nameAttr}" data-label="${labelAttr}" data-default="${defaultValueAttr}" data-value="${currentValueAttr}"></define-input>\n`
    })

    // Process intent buttons - replace with custom HTML element
    processed = processed.replace(intentRegex, (_, agent: string, buttonText: string, prompt: string) => {
      const normalizedAgent = agent.trim()
      const normalizedButtonText = buttonText.trim()
      const normalizedPrompt = prompt.trim()
      const promptKey = normalizePrompt(normalizedPrompt)
      const key = `${index}:${normalizedAgent}:${promptKey}`
      
      const keyAttr = encodeDataAttribute(key)
      const agentAttr = encodeDataAttribute(normalizedAgent)
      const buttonTextAttr = encodeDataAttribute(normalizedButtonText)
      const promptAttr = encodeDataAttribute(normalizedPrompt)

      return `\n<intent-button data-key="${keyAttr}" data-agent="${agentAttr}" data-button-text="${buttonTextAttr}" data-prompt="${promptAttr}"></intent-button>\n`
    })

    return processed
  }

  // Process blocks with their original indices (don't filter before processing)
  // This ensures preview keys match what was saved (which includes agent definition blocks in the index)
  // Reuse the blocks from useMemo above
  // Use useMemo to recompute when previewMap changes (for regeneration updates)
  const processedBlocks = useMemo(() => {
    return blocks.map((block, originalIndex) => {
      // Skip agent definition blocks in rendering, but use original index for preview lookup
      if (parseAgentDefinitionBlock(block)) {
        return ''
      }
      return processBlockWithDefines(block, originalIndex, previews || {}, userDefines, defineDefaults)
    })
  }, [blocks, previews, previewMap, userDefines, defineDefaults])
  
  const processedMarkdown = processedBlocks.filter(block => block.trim().length > 0).join('\n\n')

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        img({ src, alt, ...props }: any) {
          if (!src || typeof src !== 'string' || src.trim() === '') {
            return null
          }
          if (src.startsWith('data:image')) {
            if (src.length < 100) {
              return null
            }
          }
          return (
            <img
              src={src}
              alt={alt || 'Generated image'}
              className="rounded-lg border border-white/10 max-w-full"
              {...props}
            />
          )
        },
        ['ai-speech']: (props: any) => {
          const keyAttr = getDataAttribute(props, 'data-key')
          const agentAttr = getDataAttribute(props, 'data-agent')
          const audioDataAttr = getDataAttribute(props, 'data-audio')

          if (!keyAttr || !agentAttr || !audioDataAttr) {
            return (
              <div className="my-3 text-sm text-neutral-400">
                🎤 <strong>{agentAttr ? decodeDataAttribute(agentAttr) : 'Unknown'}</strong>: generating speech...
              </div>
            )
          }

          const audioData = decodeDataAttribute(audioDataAttr)
          const agent = decodeDataAttribute(agentAttr)

          // Check if it's a URL or data URL
          const isUrl = audioData && typeof audioData === 'string' && audioData.startsWith('/api/media')
          const isDataUrl = audioData && typeof audioData === 'string' && (audioData.startsWith('data:audio') || audioData.startsWith('data:audio/')) && audioData.length > 100

          if (!isUrl && !isDataUrl) {
            return (
              <div className="my-3 text-sm text-neutral-400">
                🎤 <strong>{agent}</strong>: generating speech...
              </div>
            )
          }

          // Extract MIME type from data URL if needed
          let mimeType = 'audio/mpeg'
          if (isDataUrl) {
            const mimeTypeMatch = audioData.match(/^data:([^;]+)/)
            mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'audio/mpeg'
          }

          return (
            <div className="my-3">
              <audio controls className="w-full rounded-lg border border-white/10">
                <source src={audioData} type={mimeType} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )
        },
        p({ node, children, ...props }: any) {
          const hasCustomElement = Array.isArray(node?.children)
            ? node.children.some((child: any) => 
                child?.tagName === 'intent-button' || child?.tagName === 'define-input' || child?.tagName === 'ai-speech'
              )
            : false
          if (hasCustomElement) {
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
          const keyAttr = getDataAttribute(props, 'data-key')
          const agentAttr = getDataAttribute(props, 'data-agent')
          const buttonTextAttr = getDataAttribute(props, 'data-button-text')
          const promptAttr = getDataAttribute(props, 'data-prompt')

          if (!keyAttr || !agentAttr || !buttonTextAttr || !promptAttr) {
            return null
          }

          const key = decodeDataAttribute(keyAttr)
          const agent = decodeDataAttribute(agentAttr)
          const buttonText = decodeDataAttribute(buttonTextAttr)
          const prompt = decodeDataAttribute(promptAttr)
          const state = intentStates[key] || { status: 'idle' as const }

          const handleClick = () => {
            if (state.status === 'loading') {
              return
            }
            handleIntentTrigger(key, agent, prompt)
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      img({ src, alt, ...props }: any) {
                        if (!src || typeof src !== 'string' || src.trim() === '') {
                          return null
                        }
                        if (src.startsWith('data:image')) {
                          if (src.length < 100) {
                            return null
                          }
                        }
                        return (
                          <img
                            src={src}
                            alt={alt || 'Generated image'}
                            className="rounded-lg border border-white/10 max-w-full"
                            {...props}
                          />
                        )
                      },
                    }}
                  >
                    {state.response}
                  </ReactMarkdown>
                </div>
              ) : null}
            </div>
          )
        },
        ['define-input']: (props: any) => {
          const keyAttr = getDataAttribute(props, 'data-key')
          const nameAttr = getDataAttribute(props, 'data-name')
          const labelAttr = getDataAttribute(props, 'data-label')
          const defaultValueAttr = getDataAttribute(props, 'data-default')
          const currentValueAttr = getDataAttribute(props, 'data-value')

          if (!keyAttr || !nameAttr || !labelAttr) {
            return null
          }

          const key = decodeDataAttribute(keyAttr)
          const name = decodeDataAttribute(nameAttr)
          const label = decodeDataAttribute(labelAttr)
          const defaultValue = decodeDataAttribute(defaultValueAttr)
          const savedValue = userDefines[key] || decodeDataAttribute(currentValueAttr) || defaultValue

          // Use a component with local state to handle typing without triggering regeneration
          const DefineInputComponent = () => {
            const [localValue, setLocalValue] = React.useState(savedValue)

            // Update local value when saved value changes (from outside)
            React.useEffect(() => {
              setLocalValue(savedValue)
            }, [savedValue])

            const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              setLocalValue(e.target.value)
            }

            const handleBlur = () => {
              if (localValue !== savedValue) {
                handleDefineChange(key, localValue)
              }
            }

            const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (localValue !== savedValue) {
                  handleDefineChange(key, localValue)
                }
                e.currentTarget.blur()
              }
            }

            return (
              <div className="my-3 flex flex-col gap-2">
                <label className="text-sm font-semibold text-neutral-300">
                  {label}
                </label>
                <input
                  type="text"
                  value={localValue}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={defaultValue || `Enter ${name}`}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 font-mono text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-violet-400 focus:outline-none"
                />
              </div>
            )
          }

          return <DefineInputComponent />
        },
      } as Components}
    >
      {processedMarkdown}
    </ReactMarkdown>
  )
}

