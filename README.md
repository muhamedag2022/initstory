# ✦ InitStory — AI-Powered On-Chain Storytelling

> Write a prompt. Let AI weave your story. Mint it as an NFT. Watch your character evolve.

[![Initia Appchain](https://img.shields.io/badge/Initia-MoveVM-amber)](https://initia.xyz)
[![AI](https://img.shields.io/badge/AI-DGrid%20Gateway-blue)](https://dgrid.ai)
[![Track](https://img.shields.io/badge/Track-AI%20%26%20Tooling-green)](https://dorahacks.io)

---

## Initia Hackathon Submission

- **Project Name**: InitStory
- **Track**: AI & Tooling
- **VM**: Move (MoveVM appchain)
- **Native Feature**: Auto-signing (Session UX)

### Project Overview

InitStory is an AI-native storytelling platform where users write a short prompt and receive a unique AI-generated story scene — complete with narrative text and an illustrated image — that is minted as an on-chain NFT on a dedicated Initia MoveVM appchain. A character linked to the user's wallet evolves in level and lore with every story minted, creating a persistent on-chain identity that grows richer over time.

### Implementation Detail

**The Custom Implementation**: The `initstory::stories` Move module implements a dual-resource system: `Story` NFTs that capture AI-generated content on-chain, and `Character` objects that track XP and level up automatically every 3 mints. A `GlobalState` resource under the deployer address tracks platform-wide statistics. The backend uses **DGrid AI Gateway** (`api.dgrid.ai/v1`) — an OpenAI-compatible endpoint — to call `anthropic/claude-3-5-haiku` for narrative generation and `openai/dall-e-3` for scene illustration, enabling a single SDK to power both text and image AI.

**The Native Feature**: Auto-signing (`enableAutoSign`) is essential to InitStory's UX. After a one-time approval, users can generate and mint stories in a single smooth flow without any wallet popup per transaction. This is what makes the mint feel instant and magical — the blockchain becomes invisible infrastructure, exactly as Initia intended.

---

## Architecture

```
User (browser)
  │
  ├─► InterwovenKit (wallet + auto-sign)
  │
  ├─► React Frontend (initstory-frontend)
  │     └── useInitStory hook → MsgExecute → MoveVM appchain
  │
  └─► Express Backend (port 3001)
        └── DGrid AI Gateway (api.dgrid.ai/v1)
              ├── anthropic/claude-3-5-haiku  → story text
              └── openai/dall-e-3             → scene image

On-chain (MoveVM rollup: initstory-1)
  └── initstory::stories module
        ├── Story    (NFT per mint)
        ├── Character (evolves per user)
        ├── Registry  (per-user counts)
        └── GlobalState (platform stats)
```

---

## How to Run Locally

### Prerequisites
- Node.js ≥ 18, Go 1.22+, Docker Desktop running
- `weave`, `initiad`, `minitiad` installed ([setup guide](https://docs.initia.xyz/hackathon/get-started))
- A DGrid API key from [dgrid.ai](https://blog.dgrid.ai/posts/2026-01-04/)

---

### Step 1 — Launch Your Appchain

```bash
weave init
# Select: Generate new account → Launch new rollup → Testnet → Move VM
# Chain ID: initstory-1
# Fund gas station at: https://app.testnet.initia.xyz/faucet
```

### Step 2 — Deploy the Move Contract

```bash
cd initstory-contract

# Get your gas-station hex address
GAS_HEX=$(minitiad keys show gas-station --keyring-backend test -a | xargs minitiad keys parse | grep bytes | awk '{print "0x"$2}')

# Build & deploy
minitiad move build --language-version=2.1 --named-addresses initstory=$GAS_HEX
minitiad move deploy --build \
  --language-version=2.1 \
  --named-addresses initstory=$GAS_HEX \
  --from gas-station \
  --keyring-backend test \
  --chain-id initstory-1 \
  --gas auto --gas-adjustment 1.4 --yes
```

Copy the deployed module address (bech32 format) for Step 4.

### Step 3 — Start the Backend

```bash
cd backend
cp .env.example .env
# Edit .env → add your DGRID_API_KEY
npm install
npm run dev
# Running at http://localhost:3001
```

### Step 4 — Start the Frontend

```bash
cd initstory-frontend

# Gather chain values
APPCHAIN_ID=$(curl -s http://localhost:26657/status | jq -r '.result.node_info.network')
NATIVE_DENOM=$(minitiad q bank total --output json | jq -r '.supply[0].denom')

# Create .env
cp .env.example .env
# Edit .env:
#   VITE_APPCHAIN_ID=initstory-1
#   VITE_NATIVE_DENOM=$NATIVE_DENOM
#   VITE_MODULE_ADDRESS=<bech32 from Step 2>

npm install
npm run dev
# Open http://localhost:3000
```

### Step 5 — Fund Your Browser Wallet

```bash
# Copy your init1... address from the browser wallet, then:
minitiad tx bank send gas-station <YOUR_WALLET_ADDRESS> 100000000umin \
  --chain-id initstory-1 --keyring-backend test --gas auto --yes
```

### Step 6 — Test the Flow

1. Connect wallet at `http://localhost:3000`
2. Create a character (name + genre)
3. Write a prompt → click **Generate Story**
4. Review the AI-generated story and image
5. Enable Auto-sign → click **Mint as NFT**
6. Watch your character gain XP and level up after 3 stories

---

## Revenue Model

| Action | Revenue |
|--------|---------|
| `create_character` | Gas fee → appchain (no external leakage) |
| `mint_story` | Gas fee → appchain |
| Future: story marketplace | % of each resale → appchain fee module |

Every transaction on InitStory generates revenue that stays entirely within the appchain, with zero gas leakage to external sequencers or validators.

---

## Initia-Native Features Used

| Feature | Implementation |
|---------|---------------|
| **Auto-signing** | `enableAutoSign={true}` in `InterwovenKitProvider`; `autoSign.enable/disable` in the UI toggle; `autoSign: true` in `requestTxSync` |
| **InterwovenKit** | All wallet connection + every transaction via `@initia/interwovenkit-react` |
| **Initia Usernames** | `.init` address displayed in wallet button via `useInterwovenKit().initiaAddress` |

---

## Smart Contract

**Module**: `initstory::stories`  
**File**: `initstory-contract/sources/stories.move`

Key functions:
- `create_character(name, genre, deployer)` — creates a `Character` resource
- `mint_story(prompt, content, image_uri, genre, char_id, block_height, deployer)` — mints a `Story` + evolves `Character`
- `#[view] get_character(addr)` — returns `CharacterView`
- `#[view] get_registry(addr)` — returns story/character counts
- `#[view] global_stats(deployer)` — platform totals

Character evolution: every 3 stories = +1 level (max level 10).

---

## AI Integration (DGrid Gateway)

DGrid AI Gateway provides an OpenAI-compatible endpoint (`https://api.dgrid.ai/v1`) that routes to 200+ models. InitStory uses:

| Model | Purpose |
|-------|---------|
| `anthropic/claude-3-5-haiku` | Narrative story generation |
| `openai/dall-e-3` | Scene illustration |

A single OpenAI SDK client handles both with just a `baseURL` change — no multi-SDK complexity.

---

## Project Structure

```
initstory/
├── .initia/
│   └── submission.json          ← hackathon submission
├── initstory-contract/
│   ├── Move.toml
│   └── sources/
│       └── stories.move         ← core on-chain logic
├── backend/
│   ├── server.js                ← Express + DGrid AI Gateway
│   ├── package.json
│   └── .env.example
└── initstory-frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx             ← InterwovenKit provider
        ├── App.jsx              ← full UI
        ├── index.css            ← dark editorial design
        └── hooks/
            └── useInitStory.js  ← all blockchain + AI interactions
```

---

## License

MIT
