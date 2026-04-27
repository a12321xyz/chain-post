import { z } from 'zod';
import { isValidWalletAddress, requireWalletSession } from '@/lib/auth';
import { createPost, getPosts, getPostsByWallet } from '@/lib/store';
import { getStorageMode } from '@/lib/store';

const walletSchema = z.object({
  wallet: z.string().trim().min(1).refine(isValidWalletAddress, 'Invalid wallet address'),
});

const createPostSchema = z.object({
  walletAddress: z.string().trim().min(1).refine(isValidWalletAddress, 'Invalid wallet address'),
  title: z.string().trim().min(4, 'Title must be at least 4 characters').max(120, 'Title must be 120 characters or less'),
  content: z.string().trim().min(20, 'Post body must be at least 20 characters'),
  category: z.string().trim().min(2).max(40),
  tags: z.array(z.string().trim().min(1).max(30)).max(5),
  isOnChain: z.boolean().optional().default(false),
  storageProvider: z.enum(['vercel-blob', 'memory', 'shelby']).optional(),
  storageRef: z.string().trim().min(1).max(600).optional(),
  storageAccount: z.string().trim().min(1).refine(isValidWalletAddress, 'Invalid storage account').optional(),
  storageBlobName: z.string().trim().min(1).max(300).optional(),
  storageNetwork: z.string().trim().min(1).max(40).optional(),
  txHash: z.string().trim().regex(/^0x[0-9a-fA-F]+$/).optional(),
}).superRefine((input, ctx) => {
  if (input.storageProvider !== 'shelby') return;

  for (const key of ['storageRef', 'storageAccount', 'storageBlobName', 'storageNetwork', 'txHash'] as const) {
    if (!input[key]) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: `${key} is required for Shelby posts`,
      });
    }
  }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    const posts = await getPosts();
    return Response.json({ posts });
  }

  const parsed = walletSchema.safeParse({ wallet });
  if (!parsed.success) {
    return Response.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const posts = await getPostsByWallet(parsed.data.wallet);
  return Response.json({ posts });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid post payload' }, { status: 400 });
  }

  const isAuthorized = await requireWalletSession(parsed.data.walletAddress);
  if (!isAuthorized) {
    return Response.json({ error: 'Verify your wallet before publishing.' }, { status: 401 });
  }

  try {
    const post = await createPost(parsed.data);
    return Response.json({ post, storageMode: getStorageMode() }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'PROFILE_REQUIRED') {
      return Response.json({ error: 'Create your profile before publishing a post.' }, { status: 400 });
    }

    if (error instanceof Error && error.message === 'SLUG_CONFLICT') {
      return Response.json({ error: 'Could not reserve a unique slug for this title. Please try again.' }, { status: 409 });
    }

    if (error instanceof Error && error.message === 'SHELBY_METADATA_REQUIRED') {
      return Response.json({ error: 'Shelby storage metadata is required before publishing.' }, { status: 400 });
    }

    if (error instanceof Error && error.message === 'SHELBY_ACCOUNT_MISMATCH') {
      return Response.json({ error: 'Shelby blob owner must match the connected wallet.' }, { status: 400 });
    }

    return Response.json({ error: 'Could not create post' }, { status: 500 });
  }
}
