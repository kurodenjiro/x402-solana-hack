---
title: AI-native Playground Documentation
description: Complete guide to creating AI-native playgrounds with Markdown, Solana wallets, and x402 monetization.
---

# Getting Started

Create AI-native playgrounds using Markdown syntax. Connect your Solana wallet, define agents and tools, and publish interactive playgrounds.

## Quick Start

1. **Connect your wallet** – Click "Connect wallet" in the header
2. **Open workspace** – Navigate to `/workspace` to create a new playground
3. **Write Markdown** – Use the syntax below to define agents, tools, and AI calls
4. **Publish** – Save your playground and it will appear in the feed

# Markdown Syntax

## Agent Definitions

Define agents, tools, and MCP connections inside a `:::` block:

````markdown
:::
@define[Wallet](3NAseqQ76ATx6E9iG8EztpGS1ofgt3URvGSZf965XLeA)

@mcp[SolanaMCP]("https://mcp.solana.com/mcp")
**Description:** Solana MCP service for protocol metadata and account enrichment.

@tool[SolanaBalanceTool](address: String)
**Description:** Get Solana balance for a wallet address.

@ai[BalanceSummarizer]("gpt-4o-mini",[SolanaMCP,SolanaBalanceTool])
**Description:** Summarize risks and opportunities across holdings.
:::
````

## Capabilities

List your playground's capabilities using code-formatted syntax:

````markdown
## 🧠 Capabilities

- `@arg[Wallet]:String` (Primary wallet to analyze)
- `@ai[BalanceSummarizer]("gpt-4o-mini",[SolanaMCP,SolanaBalanceTool])`
- `@mcp[SolanaMCP]("https://mcp.solana.com/mcp")`
````

## AI Calls

Use `~ai[AgentName]("prompt")` to generate AI responses:

````markdown
~ai[BalanceSummarizer]("
Summarize risks and opportunities for wallet {Wallet}.
Include:
- At-risk positions
- Suggested rebalancing moves
- Notable protocol exposure
")
````

The `{Wallet}` placeholder will be automatically replaced with the wallet address defined in `@define[Wallet]`.

## Interactive Intents

Create clickable buttons that trigger AI calls:

````markdown
~intent[BalanceSummarizer](<Summarize risks>,Summarize only the most at-risk positions for {Wallet} in one sentence.)
````

Syntax: `~intent[AgentName](<Button Text>,prompt)`

- The button text appears in the UI
- Clicking the button sends the prompt to the specified agent
- The response appears below the button

## Workflow

Document your playground's workflow:

````markdown
## 🛠️ Workflow

1. Fetch balances for {Wallet}
2. Group positions by protocol
3. Generate recommendations via AI
````

# Features

## Wallet Integration

- Connect Solana wallets (Phantom, Solflare, Ledger, Torus)
- Wallet address is automatically saved when creating playgrounds
- View all playgrounds created by a wallet on profile pages

## Profile Pages

Each wallet has a profile page at `/profile/{walletAddress}` showing:
- All playgrounds created by that wallet
- Playground count
- Clickable wallet addresses throughout the app

## Feed

- Browse all published playgrounds at `/feed`
- Single-column layout for easy reading
- See wallet addresses of creators
- Click any wallet to view their profile

## Editor

The workspace editor includes:
- Live preview of Markdown with AI responses
- Drag-and-drop block reordering
- Real-time AI preview generation
- Interactive intent buttons

# API Endpoints

- `POST /api/playgrounds` – Create or update a playground (requires wallet connection)
- `GET /api/playgrounds` – List all published playgrounds
- `POST /api/generate` – Generate AI responses (used by `~ai` and `~intent` blocks)
- `POST /api/x402/session-token` – Fetch paywall session tokens from x402

# Best Practices

1. **Define wallets first** – Use `@define[Wallet]` at the top of your agent definition block
2. **Use placeholders** – Reference `{Wallet}` in prompts to automatically substitute values
3. **Test intents** – Use `~intent` blocks to create interactive experiences
4. **Keep it simple** – Start with basic AI calls, then add tools and MCP connections
5. **Document workflows** – Add clear workflow sections to help users understand your playground

# Examples

Check out the starter template in the workspace editor for a complete example including:
- Agent definitions
- MCP connections
- Tool definitions
- AI calls with multi-line prompts
- Interactive intent buttons

