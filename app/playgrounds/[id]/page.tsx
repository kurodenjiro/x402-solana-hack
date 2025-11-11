import React from 'react'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { loadPlaygroundById, loadPlaygroundBySlug } from '@/lib/playgrounds'

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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pb-24 pt-12 sm:px-8 lg:px-0">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">{playground.title}</h1>
        <p className="text-sm text-neutral-400">{playground.summary}</p>
      </header>
      <section className="surface-panel prose prose-invert max-w-none p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{playground.markdown}</ReactMarkdown>
      </section>
    </main>
  )
}
