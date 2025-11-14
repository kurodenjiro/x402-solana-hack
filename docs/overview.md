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

Define agents, tools, and MCP connections inside a `:::` block. **Note:** Agent definition blocks are hidden in the playground viewer but their definitions are still used for AI generation.

````markdown
:::
@define[Wallet](3NAseqQ76ATx6E9iG8EztpGS1ofgt3URvGSZf965XLeA)

@mcp[SolanaMCP](https://mcp.solana.com/mcp)
**Description:** Solana MCP service for protocol metadata and account enrichment.

@tool[SolanaBalanceTool](address: String)
**Description:** Get Solana balance for a wallet address.

@ai[BalanceSummarizer](gpt-4o-mini,[SolanaMCP,SolanaBalanceTool])
**Description:** Summarize risks and opportunities across holdings.
:::
````

**Syntax Notes:**
- No quotes needed around arguments (e.g., `@mcp[SolanaMCP](https://mcp.solana.com/mcp)`)
- Use `@define[Name](defaultValue)` to define default values for variables
- Variables can be referenced in prompts using `{Name}` syntax

## Capabilities

List your playground's capabilities using code-formatted syntax:

````markdown
## 🧠 Capabilities

- `@arg[Wallet]:String` (Primary wallet to analyze)
- `@ai[BalanceSummarizer](gpt-4o-mini,[SolanaMCP,SolanaBalanceTool])`
- `@mcp[SolanaMCP](https://mcp.solana.com/mcp)`
````

## AI Calls

Use `~ai[AgentName](prompt)` to generate AI responses. For long prompts, use triple quotes:

````markdown
~ai[BalanceSummarizer]("""
Summarize risks and opportunities for wallet {Wallet}.
Include:
- At-risk positions
- Suggested rebalancing moves
- Notable protocol exposure
""")
````

**Syntax:**
- Single-line: `~ai[AgentName](prompt)`
- Multi-line: `~ai[AgentName]("""multi-line prompt""")`
- No quotes needed for single-line prompts
- Use triple quotes `"""` for multi-line content

The `{Wallet}` placeholder will be automatically replaced with the wallet address defined in `@define[Wallet]` or from user input via `~define`.

## Interactive Intents

Create clickable buttons that trigger AI calls:

````markdown
~intent[BalanceSummarizer](<Summarize risks>,Summarize only the most at-risk positions for {Wallet} in one sentence.)
````

**Syntax:** `~intent[AgentName](<Button Text>,prompt)`

- The button text appears in the UI
- Clicking the button sends the prompt to the specified agent
- The response appears below the button
- No quotes needed around the prompt

## Image Generation

Generate images using DALL-E 3:

````markdown
~ai-image[ImageGenerator](A futuristic Solana blockchain visualization with neon colors)
````

**Syntax:** `~ai-image[AgentName](prompt)`

- Generates images using OpenAI's DALL-E 3 model
- Images are stored in the database and served via URLs
- No quotes needed around the prompt

## Speech Generation

Generate speech/audio using text-to-speech:

````markdown
~ai-speech[VoiceGenerator](Welcome to the AI-native playground. This is a demonstration of text-to-speech generation.)
````

**Syntax:** `~ai-speech[AgentName](prompt)`

- Generates audio using OpenAI's TTS-1 model
- Audio files are stored in the database and served via URLs
- No quotes needed around the prompt

## User-Defined Variables

Create input fields for user-defined variables:

````markdown
~define[Wallet](Wallet Address)
````

**Syntax:** `~define[Name](Label)`

- Creates an input field with the specified label
- Default value comes from `@define[Name](defaultValue)` in the agent definition block
- When the user changes the value, `{Name}` placeholders in prompts are updated
- AI calls that use the variable are automatically regenerated with the new value

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
- User-defined variable inputs
- Image and audio generation previews
- Save button is disabled while AI content is generating

## Media Assets

Generated images and audio are automatically stored in the database:
- Images from `~ai-image` are stored and served via `/api/media/` URLs
- Audio from `~ai-speech` is stored and served via `/api/media/` URLs
- Media assets are linked to playgrounds and persist after saving
- Fallback to data URLs if storage fails (backward compatible)

# API Endpoints

- `POST /api/playgrounds` – Create or update a playground (requires wallet connection)
- `GET /api/playgrounds` – List all published playgrounds
- `POST /api/generate` – Generate AI responses, images, or speech (used by `~ai`, `~ai-image`, `~ai-speech`, and `~intent` blocks)
- `GET /api/media/[path]` – Serve stored media assets (images and audio)
- `POST /api/media` – Store media assets (used internally)
- `POST /api/x402/session-token` – Fetch paywall session tokens from x402

# Best Practices

1. **Define wallets first** – Use `@define[Wallet]` at the top of your agent definition block
2. **Use placeholders** – Reference `{Wallet}` in prompts to automatically substitute values
3. **Use triple quotes for long prompts** – Use `"""` for multi-line prompts to improve readability
4. **Test intents** – Use `~intent` blocks to create interactive experiences
5. **Keep it simple** – Start with basic AI calls, then add tools and MCP connections
6. **Document workflows** – Add clear workflow sections to help users understand your playground
7. **Save after generation** – Wait for AI content to finish generating before saving to ensure all previews are stored
8. **Use user-defined variables** – Use `~define` to create interactive inputs that update AI prompts dynamically

# Examples

Check out the starter template in the workspace editor for a complete example including:
- Agent definitions
- MCP connections
- Tool definitions
- AI calls with multi-line prompts (using triple quotes)
- Interactive intent buttons
- Image generation
- Speech generation
- User-defined variables

## Complete Example

````markdown
:::
@define[Wallet](3NAseqQ76ATx6E9iG8EztpGS1ofgt3URvGSZf965XLeA)

@mcp[SolanaMCP](https://mcp.solana.com/mcp)
**Description:** Solana MCP service for protocol metadata and account enrichment.

@tool[SolanaBalanceTool](address: String)
**Description:** Get Solana balance for a wallet address.

@ai[BalanceSummarizer](gpt-4o-mini,[SolanaMCP,SolanaBalanceTool])
**Description:** Summarize risks and opportunities across holdings.
:::

# Portfolio Copilot

> A markdown-native agent that reads on-chain data, builds reports, and suggests next actions.

## 🧠 Capabilities

- `@arg[Wallet]:String` (Primary wallet to analyze)
- `@ai[BalanceSummarizer](gpt-4o-mini,[SolanaMCP,SolanaBalanceTool])`
- `@mcp[SolanaMCP](https://mcp.solana.com/mcp)`

## 🛠️ Workflow

1. Fetch balances for {Wallet}
2. Group positions by protocol
3. Generate recommendations via AI

~ai[BalanceSummarizer]("""
Summarize risks and opportunities for wallet {Wallet}.
Include:
- At-risk positions
- Suggested rebalancing moves
- Notable protocol exposure
""")

~intent[BalanceSummarizer](<Summarize risks>,Summarize only the most at-risk positions for {Wallet} in one sentence.)

~define[Wallet](Wallet Address)

~ai-image[ImageGenerator](A futuristic Solana blockchain visualization with neon colors)

~ai-speech[VoiceGenerator](Welcome to the AI-native playground. This is a demonstration of text-to-speech generation.)
````

