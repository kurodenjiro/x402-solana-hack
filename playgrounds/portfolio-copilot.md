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

- @arg[WalletAddress]:String (Primary wallet to analyze)
- @tool[SolanaRPC](endpoint: {RPC_URL}, caching: true)
- @ai[BalanceSummarizer](model: "gpt-4o-mini", tool: [SolanaRPC])

## 🛠️ Workflow

1. Fetch balances for {WalletAddress}
2. Group positions by protocol
3. Generate recommendations via ~ai[BalanceSummarizer]("Summarize risks and opportunities")

## 🧾 Paywall

This playground requires an x402 payment of **$0.25** to run full analyses.

```
[lv1]
  Dashboard
    [lv2]
      Net Worth: {TotalValue}
      24h Change: {Change24h}
```


