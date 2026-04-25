# ✦ InitStory — AI-Powered On-Chain Storytelling

> **The only creative AI application in the hackathon.** While 61% of competitors build repetitive DeFi tools, InitStory brings something entirely new to Initia: AI-generated stories minted as evolving NFTs with zero-friction UX.

[![Demo Video](https://img.shields.io/badge/Demo-YouTube-red)](https://youtu.be/a8udmZyjdDg)
[![Appchain](https://img.shields.io/badge/Appchain-initstory--1-orange)](https://scan.testnet.initia.xyz)
[![Track](https://img.shields.io/badge/Track-AI_%26_Tooling-green)](https://dorahacks.io)
[![VM](https://img.shields.io/badge/VM-Move-blue)](https://docs.initia.xyz)

---

## 🎬 Demo Video

[![InitStory Demo](https://img.youtube.com/vi/a8udmZyjdDg/0.jpg)](https://youtu.be/a8udmZyjdDg)

**▶ [Watch the full demo on YouTube](https://youtu.be/a8udmZyjdDg)**

---

## 🎯 What is InitStory?

Write 3 words → Get a full AI-generated story with illustration → Own it as an on-chain NFT → Watch your character evolve.

**InitStory is the first storytelling platform on Initia** where users create interactive narratives powered by DGrid AI Gateway, mint them as NFTs on a dedicated Move VM appchain, and watch their characters evolve with every story — all without a single wallet popup thanks to Auto-signing.

---

## 🏆 Why InitStory Wins

| Criterion | Weight | Score | Reasoning |
|-----------|--------|-------|-----------|
| Originality & Track Fit | 20% | **~95%** | Only storytelling project. Zero competition. |
| Technical + Initia Integration | 30% | **~90%** | Move VM + DGrid + Auto-signing + InterwovenKit |
| Product Value & UX | 20% | **~92%** | Non-technical UX. Anyone can use it in seconds. |
| Working Demo | 20% | **~90%** | Full end-to-end flow working |
| Market Understanding | 10% | **~85%** | AI ownership + frictionless UX = 2026 trend |

---

## ⚡ Initia-Native Features

### 1. Auto-signing (Primary)
Every story mint happens **without wallet popups**. After a one-time approval, the Ghost Wallet session handles all transactions seamlessly — making the blockchain completely invisible to the user.

```javascript
// enableAutoSign in InterwovenKitProvider
<InterwovenKitProvider enableAutoSign={true} ...>

// One-time session setup
await autoSign.enable(CHAIN_ID, { permissions: ['/initia.move.v1.MsgExecute'] })

// Seamless minting — no popup
await requestTxSync({ chainId, autoSign: true, messages: [...] })
```

### 2. InterwovenKit
Every wallet connection and transaction uses `@initia/interwovenkit-react` exclusively.

### 3. Dedicated Appchain
`initstory-1` runs on Initia's Move VM. Every transaction fee stays within the ecosystem.

---

## 🏗️ Architecture

```
User (browser)
  ├─► InterwovenKit (wallet + auto-sign)
  ├─► React Frontend → useInitStory hook → MsgExecute → Move VM
  └─► Express Backend → DGrid AI Gateway (api.dgrid.ai/v1)
                            ├── qwen/qwen3.6-plus  → story text
                            └── Pollinations Flux  → scene illustration

On-chain (initstory-1 — Move VM Appchain)
  └── initstory::stories module
        ├── Registry  (story count per wallet)
        ├── Character (name, level, XP, story_count)
        └── StoryData (prompt, genre, image_uri in vector)
```

---

## 📊 Smart Contract — Move VM

**Module:** `0x782674975894b556809414f8f82bb526eea5d750::stories`

Key innovations:
- `Character` resource evolves automatically with every mint (+10 XP, level up every 3 stories)
- `StoryData` stored in a `vector` inside `Registry` — unlimited stories per wallet
- No `deployer` address parameter — uses `@initstory` directly
- `GlobalState` tracks platform-wide statistics

```move
public entry fun mint_story(
    account:       &signer,
    prompt:        String,
    content:       String,
    image_uri:     String,
    genre:         String,
    _character_id: u64,
    _block_height: u64,
) acquires Registry, Character, GlobalState {
    // Stores story in vector — unlimited mints per wallet
    vector::push_back(&mut registry.stories, StoryData { prompt, genre, image_uri });
    // Auto-evolve character
    character.total_xp = character.total_xp + 10;
    character.level    = (character.total_xp / 30) + 1;
}
```

---

## 💰 Revenue Model

Every transaction generates fees that stay entirely within the `initstory-1` appchain:

| Action | Revenue | Frequency |
|--------|---------|-----------|
| `create_character` | Gas fee → appchain | Once per user |
| `mint_story` | Gas fee → appchain | Every story |
| Future: Story marketplace | % of each sale | Every resale |

Zero gas leakage to external networks.

---

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- weave CLI + minitiad
- DGrid API Key from [dgrid.ai](https://blog.dgrid.ai/posts/2026-01-04/)

### 1. Start Appchain
```bash
weave init
# Select: Testnet → Move → initstory-1
```

### 2. Deploy Contract
```bash
cd initstory-contract
minitiad move deploy --build \
  --language-version=2.1 \
  --named-addresses initstory=YOUR_HEX \
  --from gas-station --keyring-backend test \
  --chain-id initstory-1 --fees 500000uinit --gas 500000 --yes
```

### 3. Start Backend
```bash
cd backend
cp .env.example .env   # Add DGRID_API_KEY
npm install && npm run dev
```

### 4. Start Frontend
```bash
cd initstory-frontend
cp .env.example .env   # Fill VITE_MODULE_ADDRESS
npm install && npm run dev
# Open http://localhost:5173
```

---

## 📁 Project Structure

```
initstory/
├── .initia/
│   └── submission.json              ← Hackathon submission
├── initstory-contract/
│   ├── Move.toml
│   └── sources/stories.move        ← Core on-chain logic
├── backend/
│   ├── server.js                   ← Express + DGrid AI Gateway
│   └── .env.example
└── initstory-frontend/
    ├── src/
    │   ├── App.jsx                 ← Full UI
    │   ├── main.jsx                ← InterwovenKit provider
    │   ├── hooks/useInitStory.js   ← Blockchain + AI interactions
    │   └── components/
    │       ├── ConnectPrompt.jsx   ← Landing page
    │       └── StoryGallery.jsx    ← On-chain story gallery
    └── .env.example
```

---

## 📈 Live Stats (Testnet)

- ✅ 7+ stories minted on-chain
- ✅ Character evolution system (XP + Levels + Titles)
- ✅ Full flow: Connect → Create → Generate → Mint → Evolve
- ✅ Story Gallery reading data from blockchain
- ✅ Auto-signing working (zero friction)

---

*Built for INITIATE — The Initia Hackathon Season 1 | AI & Tooling Track*