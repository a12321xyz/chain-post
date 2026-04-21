import { z } from 'zod';
import { clearWalletSession, getWalletSession, isValidWalletAddress, normalizeWalletAddress } from '@/lib/auth';

const walletSchema = z.object({
  wallet: z.string().trim().min(1).refine(isValidWalletAddress, 'Invalid wallet address'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return Response.json({ authenticated: false });
  }

  const parsed = walletSchema.safeParse({ wallet });
  if (!parsed.success) {
    return Response.json({ authenticated: false }, { status: 400 });
  }

  const session = await getWalletSession();
  const normalizedWallet = normalizeWalletAddress(parsed.data.wallet);

  return Response.json({
    authenticated: session?.walletAddress === normalizedWallet,
    walletAddress: session?.walletAddress ?? null,
    expiresAt: session?.expiresAt ?? null,
  });
}

export async function DELETE() {
  await clearWalletSession();
  return Response.json({ authenticated: false });
}
