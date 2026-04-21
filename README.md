# ChainPost ⛓️📝

**Publish with Your Wallet. Own Your Creator Identity.**

ChainPost is a decentralized, wallet-connected blogging platform built for the **Shelby Developer Program**. It empowers writers to seamlessly log in with their Aptos wallets, publish markdown content, and persist it entirely on-chain or via decentralized storage networks.

## Features ✨

- **Web3 Authentication:** Instant login using any Aptos wallet (Petra, Martian, Pontem) via `@aptos-labs/wallet-adapter-react`.
- **Markdown Editor:** Write beautiful posts with full Git-Flavored Markdown (GFM) support, live previews, and syntax highlighting.
- **On-Chain Publishing (Mock):** Toggle the ability to simulate writing post hashes directly to the Aptos blockchain, showcasing future smart contract integration capabilities.
- **Robust Storage Architecture:** Uses `@vercel/blob` for durable off-chain persistence while keeping an elegant in-memory fallback for instant local testing without `.env` setup.
- **Performant & SEO Ready:** Built with Next.js App Router and statically rendered pages for blazingly fast read times.

## Tech Stack 🛠️

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Lucide Icons
- **Web3 / Blockchain:** Aptos SDK, Aptos Wallet Adapter
- **Storage:** Vercel Blob (Object Storage)
- **Deployment:** Vercel

## Getting Started 🚀

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/chain-post.git
cd chain-post
npm install
```

### 2. Configure Vercel Blob (Persistent Storage)
For persistent storage, copy the env file and add your Vercel Blob token:
```bash
cp .env.example .env.local
```
Inside Vercel, navigate to **Storage > Add Blob** to provision a free blob store. Copy your `BLOB_READ_WRITE_TOKEN` into your `.env.local`. 

If left blank, the app will gracefully fall back to running entirely in ephemeral memory mode for easy testing.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser. Connect an Aptos wallet (Testnet) to create a profile and write your first post!

## Architecture Note for Judges 🔍

This project demonstrates a **Web2.5** paradigm:
- Identity is entirely decentralized (Wallet Signatures via Aptos).
- Heavy content (Markdown) is stored in a scalable off-chain blob store (Vercel Blob).
- Application structure is built to drop-in Shelby Protocol or Aptos Move smart contracts for the final decentralized persistence layer.

---

*Built for the Shelby Developer Program 2026*
