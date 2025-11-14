import { NextResponse } from 'next/server'
import { generateText, experimental_generateImage as generateImage, type ToolSet } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { experimental_createMCPClient } from '@ai-sdk/mcp'

type ToolConfig = {
  name: string
  params: string
}

type GenerateRequest = {
  type?: 'text' | 'image'
  bot?: string
  prompt?: string
  config?: {
    signature?: string
    tool?: ToolConfig
  }
  calls?: Array<{
    bot: string
    prompt: string
    signature?: string
    tool?: ToolConfig
  }>
  mcp?: Array<{
    name: string
    params: string
  }>
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const toToolIdentifier = (name: string, params: string, index: number) => {
  const base = `${name}_${params}`.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `tool_${index}`
  return base.toLowerCase()
}

const extractEndpoint = (params: string) => {
  if (!params) {
    return null
  }
  const match = params.match(/endpoint\s*:\s*["']([^"']+)["']/i)
  return match ? match[1] : null
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const mcpClients: Awaited<ReturnType<typeof experimental_createMCPClient>>[] = []
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY environment variable.' },
        { status: 500 },
      )
    }

    const body = (await request.json()) as GenerateRequest
    const type = body.type ?? 'text'
    const call = body.calls?.[0]
    const bot = call?.bot ?? body.bot
    const prompt = call?.prompt ?? body.prompt
    const config = call
      ? {
          signature: call.signature,
          tool: call.tool,
        }
      : body.config

    if (!bot || !prompt) {
      return NextResponse.json({ error: 'Both bot and prompt are required.' }, { status: 400 })
    }

    // Handle image generation
    if (type === 'image') {
      try {
        const result = await generateImage({
          model: openai.image('dall-e-3'),
          prompt: prompt,
          n: 1,
          size: '1024x1024',
        })

        const images = result.images
        if (images && images.length > 0) {
          const image = images[0]
          // Convert to base64 data URL
          // The image object should have base64 property
          const base64 = image.base64
          if (!base64) {
            console.error('Image generated but no base64 data found', { image: Object.keys(image) })
            return NextResponse.json({ error: 'Image generated but no base64 data available.' }, { status: 500 })
          }
          const mediaType = image.mediaType || 'image/png'
          const dataUrl = `data:${mediaType};base64,${base64}`

          // Validate the data URL is complete
          if (dataUrl.length < 100) {
            console.error('Generated data URL is too short', { length: dataUrl.length })
            return NextResponse.json({ error: 'Generated image data is incomplete.' }, { status: 500 })
          }

          return NextResponse.json({ image: dataUrl })
        }

        return NextResponse.json({ error: 'No image generated.' }, { status: 500 })
      } catch (error) {
        console.error('Image generation failed', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate image.'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
      }
    }

    const toolConfigs: ToolConfig[] = []
    if (config?.tool) {
      toolConfigs.push(config.tool)
    }
    if (body.config?.tool) {
      toolConfigs.push(body.config.tool)
    }
    const mcpDefinitions = body.mcp ?? []

    const dedupedTools = new Map<string, { config: ToolConfig; index: number }>()
    toolConfigs.forEach((toolConfig, index) => {
      const key = `${toolConfig.name}|${toolConfig.params}`
      if (!dedupedTools.has(key)) {
        dedupedTools.set(key, { config: toolConfig, index })
      }
    })
    const toolEntries = Array.from(dedupedTools.values()).map(({ config: toolConfig, index }) => ({
      id: toToolIdentifier(toolConfig.name, toolConfig.params, index),
      config: toolConfig,
    }))

    const configurationLines: string[] = []
    if (config?.signature) {
      configurationLines.push(`Signature: ${config.signature}`)
    }
    toolEntries.forEach(({ config: toolConfig, id }) => {
      configurationLines.push(`Tool: ${toolConfig.name}(${toolConfig.params}) -> identifier "${id}"`)
    })

    const mcpToolSets: ToolSet[] = []
    for (const definition of mcpDefinitions) {
      const endpoint = extractEndpoint(definition.params)
      if (!endpoint) {
        continue
      }
      try {
        const client = await experimental_createMCPClient({
          transport: {
            type: 'http',
            url: endpoint,
          },
        })
        mcpClients.push(client)
        const tools = (await client.tools()) as ToolSet
        if (tools && Object.keys(tools).length) {
          mcpToolSets.push(tools)
          configurationLines.push(`MCP Endpoint: ${endpoint}`)
        }
      } catch (error) {
        console.error(`Failed to load MCP tools from ${endpoint}`, error)
      }
    }

    const combinedTools: ToolSet | undefined =
      mcpToolSets.length > 0 ? (Object.assign({}, ...mcpToolSets) as ToolSet) : undefined

    const promptSegments = [
      `You are ${bot}, an AI assistant specialized for Solana Markdown playgrounds.`,
      'Be concise, objective, and return concrete values when possible.',
    ]

    if (configurationLines.length) {
      promptSegments.push('')
      promptSegments.push('Configuration:')
      promptSegments.push(...configurationLines)
    }

    if (combinedTools && Object.keys(combinedTools).length) {
      promptSegments.push('')
      promptSegments.push(
        'When needed, call the provided tool identifiers and incorporate their results into your final answer.',
      )
    }

    promptSegments.push('')
    promptSegments.push(prompt)

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      ...(combinedTools ? { tools: combinedTools, toolChoice: 'auto' as const } : {}),
      prompt: promptSegments.join('\n'),
    })

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error('AI preview generation failed', error)
    return NextResponse.json({ error: 'Failed to generate preview.' }, { status: 500 })
  } finally {
    for (const client of mcpClients) {
      try {
        await client.close()
      } catch (error) {
        if (!(error instanceof Error) || error.name !== 'AbortError') {
          console.error('Failed to close MCP client', error)
        }
      }
    }
  }
}

