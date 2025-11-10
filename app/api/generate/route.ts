import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

type GenerateRequest = {
  type?: 'text'
  bot?: string
  prompt?: string
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY environment variable.' },
        { status: 500 },
      )
    }

    const body = (await request.json()) as GenerateRequest
    const { bot, prompt } = body

    if (!bot || !prompt) {
      return NextResponse.json({ error: 'Both bot and prompt are required.' }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: [
        `You are ${bot}, an AI assistant specialized for Solana Markdown playgrounds.`,
        'Be concise, objective, and return concrete values when possible.',
        '',
        prompt,
      ].join('\n'),
    })

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error('AI preview generation failed', error)
    return NextResponse.json({ error: 'Failed to generate preview.' }, { status: 500 })
  }
}

