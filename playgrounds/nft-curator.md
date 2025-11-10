---
title: NFT Curator
summary: Curate NFT drops with metadata enrichment and x402-enabled previews.
tags:
  - nft
  - curation
price: '$0.15'
resource: /playgrounds/nft-curator
publisher: BqYT7CvVWLSp9wNLaYv5VmWbsVg2nQb7HQRFuYrB6K6p
network: solana-devnet
---

# NFT Curator

Collect on-chain metadata, remix descriptions, and schedule drops—without leaving markdown.

## Blocks

> [lv1]
> Spotlight
>   [lv2]
>   Featured Project: {ProjectName}
>   Drop Date: {DropDate}
>   Recommended Floor: {RecommendedPrice}

## Tools

@tool[MetaplexIndex](endpoint: {RPC_URL}, limit: 25)
@ai[Copywriter](model: "gpt-4o-mini")

## Flow

1. Fetch collection stats @tool[MetaplexIndex]
2. Generate copy ~ai[Copywriter](
   "Write a compelling drop description for {ProjectName} targeting collectors."
   )
3. Bundle assets, publish with x402 gating.


