import Link from 'next/link'

import { PlaygroundCard } from '@/components/playground-card'
import { PlaygroundEditor } from '@/components/editor/playground-editor'
import { listPlaygrounds } from '@/lib/playgrounds'

const heroCallouts = [
  {
    title: 'Markdown is the IDE',
    body: 'Compose agents with @tool, @ai, and block-level layout syntax, then render it live in the browser.',
  },
  {
    title: 'Workspace-ready flow',
    body: 'Spin up drafts in the Workspace, slot in Solana components, and publish without leaving the markdown-first UI.',
  },
  {
    title: 'x402 paywalls built-in',
    body: 'Attach prices to any playground path and let x402 guard premium experiences automatically.',
  },
]

const quickstart = [
  { label: 'Install dependencies', command: 'pnpm install' },
  { label: 'Create database schema', command: 'pnpm prisma:push' },
  { label: 'Seed sample playgrounds', command: 'pnpm prisma:seed' },
  { label: 'Start dev server', command: 'pnpm dev' },
]

const timeline = [
  {
    title: 'Draft in Markdown',
    description: 'Use Web3 Markdown extensions to describe capabilities, workflows, and UI blocks for your agent.',
  },
  {
    title: 'Attach pricing with x402',
    description: 'Define price + resourcePath in Prisma; middleware mirrors the solana-paywal-x402 example.',
  },
  {
    title: 'Publish to the feed',
    description: 'Drag, drop, and reorder Markdown blocks before pushing a polished playground live.',
  },
  {
    title: 'Users unlock & run agents',
    description:
      'Wallet-authenticated viewers pay via x402 and launch the experience instantly without leaving the page.',
  },
]

const ecosystems = ['Markdown DSL', 'Next.js 14', 'Prisma', 'Wallet Adapter', 'x402 Solana', 'Tailwind UI']

const heroSnippet = `> [lv1]
  Playground
    [lv2]
      @arg[Wallet]:String
      @tool[SolanaRPC](endpoint: {RPC_URL})
      ~ai[Summarizer]("Explain risks for {Wallet}")
      ~ai[Summarizer]("Balance of {Wallet}")
      ~ai[IntentClassifier]("""
Choose one label for {Wallet} from:
- INVESTOR
- DEX_USER
- NFT_WHALE
""")

@tool[x402](price: "$0.25", resource: "/playgrounds/portfolio-copilot")`

export default async function Home() {
  const playgrounds = await listPlaygrounds()

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-50">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.35),_transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.25),_transparent_60%)]" />
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-32 pt-20 sm:px-8 lg:px-12">
        <header className="surface-panel p-12 lg:p-16">
          <div className="grid gap-12 lg:grid-cols-[1.4f  r_1fr] lg:items-start">
            <div className="space-y-8">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-neutral-200">
                Inspired by agents.md
              </span>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Launch AI-native playgrounds directly from Markdown.
              </h1>
              <p className="max-w-2xl text-lg text-neutral-300">
                Author agent workflows with Web3 Markdown, monetize premium steps with x402 Solana payments, and let
                viewers run everything without leaving the page.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/workspace"
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
                >
                  Open workspace
                </Link>
                <Link
                  href="#playgrounds"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-white hover:text-white"
                >
                  Explore feed
                </Link>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-6 shadow-[0_0_80px_-30px_rgba(124,58,237,0.75)]">
              <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
                <span>agents.md</span>
                <span>markdown</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-neutral-950/70 p-5 font-mono text-xs leading-relaxed text-violet-100">
                {heroSnippet}
              </pre>
            </div>
          </div>
        </header>

        <section className=" p-10 lg:p-14">
          <dl className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {heroCallouts.map(callout => (
              <div
                key={callout.title}
                className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-black/25 p-5 shadow-[0_0_35px_-18px_rgba(124,58,237,0.55)]"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-300">
                  <span className="block text-base tracking-tight text-white">{callout.title}</span>
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-neutral-200">{callout.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-6 rounded-[3rem] border border-white/5 bg-white/[0.02] p-10 sm:grid-cols-2 lg:grid-cols-3 lg:p-14">
          {ecosystems.map(label => (
            <div
              key={label}
              className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-sm font-medium text-neutral-200"
            >
              {label}
            </div>
          ))}
        </section>

        <section className="section-card">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Quickstart</h2>
              <p className="mt-2 max-w-xl text-sm text-neutral-400">
                Rebuild the agents.md workflow with wallet auth, Markdown DSL, and x402 paywalls.
              </p>
            </div>
          </header>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickstart.map(item => (
              <div
                key={item.label}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-neutral-200"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
                  {item.label}
                </span>
                <code className="rounded-md bg-white/10 px-3 py-2 font-mono text-xs text-violet-200">{item.command}</code>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 rounded-[3rem] border border-white/5 bg-white/[0.02] p-10 lg:grid-cols-[1.25fr_1fr] lg:p-16">
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">How the platform flows</h2>
            <ol className="space-y-6 border-l border-violet-500/40 pl-6">
              {timeline.map(step => (
                <li key={step.title} className="relative">
                  <span className="absolute -left-[41px] top-1 h-3 w-3 rounded-full border border-violet-400 bg-neutral-950" />
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-neutral-400">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-neutral-300">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-400">x402 integration</h3>
            <p>
              Based on the{' '}
              <Link
                href="https://github.com/Woody4618/solana-paywal-x402"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                solana-paywal-x402
              </Link>{' '}
              example, middleware maps playground resources to prices. Prisma stores metadata so pricing updates follow a
              simple migration.
            </p>
          </div>
        </section>

        <PlaygroundEditor />

        <section
          id="playgrounds"
          className="flex flex-col gap-8 rounded-[3rem] border border-white/5 bg-white/[0.02] p-10 lg:p-16"
        >
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">AI-native playgrounds</h2>
              <p className="mt-2 max-w-xl text-sm text-neutral-400">
                Publish Markdown-defined agents, set a price, and share the link—viewers can pay via x402 and run the
                experience instantly.
              </p>
            </div>
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-white hover:text-white"
            >
              Publish your own
            </Link>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {playgrounds.map(playground => (
              <PlaygroundCard key={playground.id} playground={playground} />
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}

