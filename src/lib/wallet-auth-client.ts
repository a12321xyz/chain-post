import {
  AnyPublicKey,
  AnySignature,
  Ed25519PublicKey,
  Ed25519Signature,
  MultiEd25519PublicKey,
  MultiEd25519Signature,
  MultiKey,
  MultiKeySignature,
  PublicKey,
  Secp256k1PublicKey,
  Secp256k1Signature,
  Signature,
} from '@aptos-labs/ts-sdk';

interface WalletAccountLike {
  address: { toString(): string };
  publicKey: PublicKey;
}

interface SignedMessageLike {
  address?: string;
  fullMessage: string;
  message: string;
  nonce: string;
  signature: Signature;
}

interface EnsureWalletSessionArgs {
  walletAddress: string;
  account: WalletAccountLike | null;
  signMessage: (args: {
    address?: boolean;
    application?: boolean;
    chainId?: boolean;
    message: string;
    nonce: string;
  }) => Promise<SignedMessageLike>;
}

function serializePublicKey(publicKey: PublicKey) {
  if (publicKey instanceof Ed25519PublicKey) {
    return { publicKeyKind: 'ed25519' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  if (publicKey instanceof Secp256k1PublicKey) {
    return { publicKeyKind: 'secp256k1' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  if (publicKey instanceof AnyPublicKey) {
    return { publicKeyKind: 'any' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  if (publicKey instanceof MultiEd25519PublicKey) {
    return { publicKeyKind: 'multiEd25519' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  if (publicKey instanceof MultiKey) {
    return { publicKeyKind: 'multiKey' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  throw new Error('Unsupported wallet public key type');
}

function serializeSignature(signature: Signature) {
  if (signature instanceof Ed25519Signature) {
    return { signatureKind: 'ed25519' as const, signatureBcs: signature.bcsToHex().toString() };
  }

  if (signature instanceof Secp256k1Signature) {
    return { signatureKind: 'secp256k1' as const, signatureBcs: signature.bcsToHex().toString() };
  }

  if (signature instanceof AnySignature) {
    return { signatureKind: 'any' as const, signatureBcs: signature.bcsToHex().toString() };
  }

  if (signature instanceof MultiEd25519Signature) {
    return { signatureKind: 'multiEd25519' as const, signatureBcs: signature.bcsToHex().toString() };
  }

  if (signature instanceof MultiKeySignature) {
    return { signatureKind: 'multiKey' as const, signatureBcs: signature.bcsToHex().toString() };
  }

  throw new Error('Unsupported wallet signature type');
}

export async function ensureWalletSession({ walletAddress, account, signMessage }: EnsureWalletSessionArgs) {
  if (!walletAddress || !account) {
    throw new Error('Connect your wallet before continuing.');
  }

  const sessionResponse = await fetch(`/api/auth/session?wallet=${encodeURIComponent(walletAddress)}`, {
    cache: 'no-store',
  });

  if (sessionResponse.ok) {
    const sessionData = await sessionResponse.json();
    if (sessionData.authenticated) {
      return;
    }
  }

  const challengeResponse = await fetch('/api/auth/challenge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ walletAddress }),
  });

  const challengeData = await challengeResponse.json();
  if (!challengeResponse.ok) {
    throw new Error(challengeData.error ?? 'Could not start wallet verification.');
  }

  const signedMessage = await signMessage({
    address: true,
    application: true,
    chainId: true,
    message: challengeData.challenge.message,
    nonce: challengeData.challenge.nonce,
  });

  const verificationResponse = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
      fullMessage: signedMessage.fullMessage,
      message: signedMessage.message,
      nonce: signedMessage.nonce,
      signedAddress: signedMessage.address ?? account.address.toString(),
      ...serializePublicKey(account.publicKey),
      ...serializeSignature(signedMessage.signature),
    }),
  });

  const verificationData = await verificationResponse.json();
  if (!verificationResponse.ok) {
    throw new Error(verificationData.error ?? 'Wallet verification failed.');
  }
}

export async function clearWalletSession() {
  await fetch('/api/auth/session', {
    method: 'DELETE',
  });
}
