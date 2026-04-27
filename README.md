# ChainPost

**Publish with your wallet. Store markdown on Shelby.**

ChainPost is a wallet-connected blogging MVP built for the Shelby Developer Program. Writers connect an Aptos wallet, create a profile, write markdown, register a Shelby blob with their wallet, and upload the post body to Shelby. The app keeps lightweight feed metadata in Vercel Blob or memory so posts can be discovered and routed.

## Features

- **Wallet authentication:** Login with compatible Aptos wallets via `@aptos-labs/wallet-adapter-react`.
- **Shelby-backed publishing:** The write flow generates Shelby commitments, asks the wallet to sign the blob registration transaction, waits for confirmation, then uploads markdown bytes to Shelby RPC.
- **Markdown editor:** GitHub-Flavored Markdown support with live preview.
- **Metadata cache:** Titles, excerpts, tags, author profile data, ordering, `storageRef`, and the Shelby transaction hash are cached for app discovery. Shelby post bodies are not stored in that cache.
- **Fallback mode:** If Shelby or Vercel Blob envs are not configured, local development can still use ephemeral memory and inline content for demos.

## Tech Stack

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **Wallets:** Aptos Wallet Adapter
- **Storage:** Shelby for markdown content, Vercel Blob or memory for metadata cache
- **Deployment:** Vercel

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/a12321xyz/chain-post.git
cd chain-post
npm install
```

### 2. Configure environment

Copy the example env file:

```bash
cp .env.example .env.local
```

Set Shelby and Aptos public API keys for browser-owned Shelby uploads:

```bash
NEXT_PUBLIC_SHELBY_API_KEY=
NEXT_PUBLIC_APTOS_API_KEY=
NEXT_PUBLIC_APTOS_NETWORK=shelbynet
```

Required for production wallet sessions:

```bash
AUTH_SECRET=
```

Optional metadata persistence:

```bash
BLOB_READ_WRITE_TOKEN=
```

`AUTH_SECRET` is required in production. Local development uses a development fallback only.

Without `BLOB_READ_WRITE_TOKEN`, feed metadata and fallback posts use server memory and may reset. If `NEXT_PUBLIC_SHELBY_API_KEY` is not configured, the write flow uses the app-cache fallback for demos. Shelby-backed markdown content remains on Shelby after a successful upload.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect an Aptos wallet on the configured network, create a profile, and publish a Shelby-backed post.

## Architecture Notes

- Creator identity is wallet-based.
- Shelby posts store markdown content on Shelby and display the real registration transaction hash.
- ChainPost keeps feed metadata in an app cache for discovery and routing. If Vercel Blob is enabled, each post metadata entry and profile is stored as its own blob; this avoids rewriting one large JSON file for every post body.
- The feed metadata cache is still centralized application infrastructure. Do not treat it as decentralized storage.

Built for the Shelby Developer Program 2026.
