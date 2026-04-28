# ChainPost

Wallet-connected publishing for Aptos writers. ChainPost stores markdown on Shelby and keeps lightweight feed metadata in Vercel Blob so posts can be discovered, listed, and routed.

## What It Does

- Connect an Aptos wallet and verify ownership with a signed message.
- Create a writer profile tied to the connected wallet.
- Write posts in markdown with GitHub-Flavored Markdown preview.
- Register and upload post content to Shelby from the browser.
- Cache post metadata and profiles in Vercel Blob for production persistence.
- Fall back to in-memory storage for local demos when Vercel Blob is not configured.

## Stack

- Next.js 16 App Router
- TypeScript and React 19
- Aptos Wallet Adapter
- Shelby Protocol SDK
- Vercel Blob
- Vercel Web Analytics and Speed Insights

## Environment Variables

Set these in Vercel under Project Settings -> Environment Variables.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | Production | Signs wallet challenge and session cookies. Use a long random value. |
| `BLOB_READ_WRITE_TOKEN` | Production persistence | Enables Vercel Blob for profiles and feed metadata. Without it, the app uses server memory. |
| `NEXT_PUBLIC_SHELBY_API_KEY` | Shelby publishing | Enables Shelby uploads from the browser. Without it, users can only use the local fallback flow. |
| `NEXT_PUBLIC_APTOS_API_KEY` | Recommended | Passes an Aptos API key to Shelby/Aptos clients. |
| `NEXT_PUBLIC_APTOS_NETWORK` | Recommended | Aptos network for Shelby publishing. Use `shelbynet` unless you intentionally target `testnet`. |

Vercel Analytics and Speed Insights do not require project environment variables in this app. They are enabled by the installed Next.js components and are viewed from the Vercel dashboard after deployment.

For local development, copy the example file:

```bash
cp .env.example .env.local
```

Then fill in the values you need:

```bash
AUTH_SECRET=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_SHELBY_API_KEY=
NEXT_PUBLIC_APTOS_API_KEY=
NEXT_PUBLIC_APTOS_NETWORK=shelbynet
```

`AUTH_SECRET` is required in production. Local development uses a development-only fallback secret when `AUTH_SECRET` is not set.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect an Aptos wallet on the configured network, create a profile, and publish a post.

## Deployment

1. Import the repository into Vercel.
2. Add the environment variables listed above.
3. Create or connect a Vercel Blob store so `BLOB_READ_WRITE_TOKEN` is available.
4. Deploy the `main` branch.
5. Enable Web Analytics and Speed Insights in the Vercel project dashboard if they are not already enabled.

## Storage Model

Shelby posts store the markdown body on Shelby. ChainPost stores only discovery metadata for those posts, including title, excerpt, tags, author profile data, ordering, Shelby storage reference, and transaction hash.

Fallback posts are different: when Shelby is not used, the app stores post content in the selected app cache. In production that means Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured; otherwise it is stored only in server memory and can reset.

The metadata cache is application infrastructure. Treat Shelby as the source of truth for Shelby-backed post content.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## License

Built for the Shelby Developer Program 2026.
