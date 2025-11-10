---
title: Web3 Markdown Docs
description: Everything you need to draft, gate, and publish AI-native playgrounds with Solana + x402.
---

# Getting Started

1. Install dependencies with `pnpm install`.
2. Sync your Prisma schema via `pnpm prisma:push`.
3. Seed playground examples using `pnpm prisma:seed`.
4. Launch the dev server: `pnpm dev`.

> The workspace leverages server actions for CRUD operations. Ensure you're running Node 20.9 or newer as required by Next.js 16.

## Folder Structure

- `app/` – Next.js routes, including the Markdown-driven workspace.
- `components/` – UI shared between the feed, workspace, and docs.
- `lib/` – Prisma client, markdown parsing helpers, and client store utilities.
- `playgrounds/` – Markdown playground definitions with optional front matter.

# Authoring Playgrounds

Use **Web3 Markdown** extensions to wire up data sources, wallets, and AI helpers directly in Markdown.

```markdown
> [lv1]
  Playground
    [lv2]
      @tool[SolanaRPC](endpoint: {RPC_URL})
      ~ai[Summarizer]("Explain risks for {Wallet}")
      ~ai[Summarizer]("Balance of {Wallet}")
```

> Example response for the balance call: `0.12 SOL`

## Front Matter Reference

```yaml
---
title: Portfolio Copilot
summary: Generate wallet analytics and risk summaries.
price: '$0.25'
network: solana-devnet
tags:
  - analytics
  - defi
---
```

# Monetization with x402

1. Set `price` and `resourcePath` in the playground record.
2. Middleware verifies access against x402 before rendering gated blocks.
3. The Solana provider component loads wallet adapters client-side (`'use client'`).

```ts
<WalletProvider wallets={wallets} autoConnect>
  <WalletModalProvider>{children}</WalletModalProvider>
</WalletProvider>
```

~ai[Summarizer]("Explain risks for {Wallet}")
~ai[Summarizer]("Balance of {Wallet}")

~ai[IntentClassifier]("""
Pick a persona for {Wallet}:
- INVESTOR
- DEX_USER
- NFT_WHALE
""")

# API Endpoints

- `POST /api/playgrounds` – create or update a playground.
- `GET /api/playgrounds` – list public playgrounds.
- `POST /api/x402/session-token` – fetch paywall session tokens from x402.

# Next Steps

- Customize the Markdown renderer by extending the remark/rehype pipeline in `components/editor/`.
- Add new wallets to `components/solana-provider.tsx` if you need hardware or mobile adapters.
- Publish your markdown docs alongside playgrounds to guide collaborators.

