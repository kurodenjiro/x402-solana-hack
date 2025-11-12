---
title: Portfolio Copilot
summary: Monitor your Solana positions and generate AI-native insights on demand.
tags:
  - defi
  - analytics
  - agents
price: '$0.25'
resource: /playgrounds/portfolio-copilot
publisher: 7n2ysD7ALZjB5aXG6qPiJxHFvP7A5UthsXxFvWSvZk2E
network: solana-devnet
---

# Portfolio Copilot

> A markdown-native agent that reads on-chain data, builds reports, and suggests next actions.

## 🧠 Capabilities

- `@arg[Wallet]:String` (Primary wallet to analyze)
- `@ai[BalanceSummarizer]("gpt-4o-mini",[SolanaMCP,SolanaBalanceTool])`
- `@mcp[SolanaMCP]("https://mcp.solana.com/mcp")`

## 🛠️ Workflow

1. Fetch balances for {Wallet}
2. Group positions by protocol
3. Generate recommendations via ~ai[BalanceSummarizer]("Summarize risks and opportunities")

