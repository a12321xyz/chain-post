import { z } from 'zod';
import {
  createWalletSession,
  consumeAuthChallenge,
  isValidWalletAddress,
  PUBLIC_KEY_KINDS,
  SIGNATURE_KINDS,
  verifySignedChallengePayload,
} from '@/lib/auth';

const verifySchema = z.object({
  walletAddress: z.string().trim().min(1).refine(isValidWalletAddress, 'Invalid wallet address'),
  fullMessage: z.string().min(1),
  message: z.string().min(1),
  nonce: z.string().min(1),
  signedAddress: z.string().trim().min(1).refine(isValidWalletAddress, 'Invalid signed address'),
  publicKeyKind: z.enum(PUBLIC_KEY_KINDS),
  publicKeyBcs: z.string().trim().min(1),
  signatureKind: z.enum(SIGNATURE_KINDS),
  signatureBcs: z.string().trim().min(1),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid wallet verification payload' }, { status: 400 });
  }

  const challenge = await consumeAuthChallenge(parsed.data.walletAddress);
  if (!challenge) {
    return Response.json({ error: 'Authentication challenge expired or missing. Please try again.' }, { status: 401 });
  }

  const verified = verifySignedChallengePayload(parsed.data, challenge);
  if (!verified) {
    return Response.json({ error: 'Wallet signature verification failed.' }, { status: 401 });
  }

  await createWalletSession(parsed.data.walletAddress);
  return Response.json({ authenticated: true, walletAddress: challenge.walletAddress });
}
