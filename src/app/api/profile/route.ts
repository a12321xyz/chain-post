import { z } from 'zod';
import { isValidWalletAddress, requireWalletSession } from '@/lib/auth';
import { getAuthorByWallet, upsertAuthorProfile } from '@/lib/store';
import { getStorageMode } from '@/lib/store';
import { countGraphemes } from '@/lib/utils';

const walletSchema = z.object({
  wallet: z.string().trim().min(1).refine(isValidWalletAddress, 'Invalid wallet address'),
});

const profileSchema = z.object({
  walletAddress: z.string().trim().min(1).refine(isValidWalletAddress, 'Invalid wallet address'),
  name: z.string().trim().min(2, 'Display name must be at least 2 characters').max(40, 'Display name must be 40 characters or less'),
  bio: z.string().trim().max(280, 'Bio must be 280 characters or less'),
  avatar: z.string().trim().min(1, 'Avatar is required').refine(
    (avatar) => countGraphemes(avatar) <= 4,
    'Avatar must be 4 characters or less'
  ),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = walletSchema.safeParse({ wallet: searchParams.get('wallet') ?? '' });

  if (!parsed.success) {
    return Response.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  const profile = await getAuthorByWallet(parsed.data.wallet);
  return Response.json({ profile: profile ?? null });
}

export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid profile payload' }, { status: 400 });
  }

  const isAuthorized = await requireWalletSession(parsed.data.walletAddress);
  if (!isAuthorized) {
    return Response.json({ error: 'Verify your wallet before updating your profile.' }, { status: 401 });
  }

  const profile = await upsertAuthorProfile(parsed.data);
  return Response.json({ profile, storageMode: getStorageMode() });
}
