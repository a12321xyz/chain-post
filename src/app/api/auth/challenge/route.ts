import { z } from 'zod';
import { createAuthChallenge, isValidWalletAddress, setAuthChallengeCookie } from '@/lib/auth';

const challengeSchema = z.object({
  walletAddress: z.string().trim().min(1).refine(isValidWalletAddress, 'Invalid wallet address'),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = challengeSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  try {
    const challenge = createAuthChallenge(parsed.data.walletAddress);
    await setAuthChallengeCookie(challenge);

    return Response.json({
      challenge: {
        walletAddress: challenge.walletAddress,
        message: challenge.message,
        nonce: challenge.nonce,
        expiresAt: challenge.expiresAt,
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not create auth challenge' }, { status: 500 });
  }
}
