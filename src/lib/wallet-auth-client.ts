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

type SerializedPublicKey = ReturnType<typeof serializePublicKey>;
type BcsHexSerializable = { bcsToHex(): { toString(): string } };

function hasBcsToHex(value: unknown): value is BcsHexSerializable {
  return typeof value === 'object'
    && value !== null
    && 'bcsToHex' in value
    && typeof value.bcsToHex === 'function';
}

function hasSignatureList(value: unknown): value is { signatures: unknown[]; bitmap: unknown } {
  return typeof value === 'object'
    && value !== null
    && 'signatures' in value
    && Array.isArray(value.signatures)
    && 'bitmap' in value;
}

function isEd25519PublicKey(publicKey: PublicKey): publicKey is Ed25519PublicKey {
  return publicKey instanceof Ed25519PublicKey || Ed25519PublicKey.isInstance(publicKey);
}

function isSecp256k1PublicKey(publicKey: PublicKey): publicKey is Secp256k1PublicKey {
  return publicKey instanceof Secp256k1PublicKey || Secp256k1PublicKey.isInstance(publicKey);
}

function isAnyPublicKey(publicKey: PublicKey): publicKey is AnyPublicKey {
  return publicKey instanceof AnyPublicKey || AnyPublicKey.isInstance(publicKey);
}

function isMultiEd25519PublicKey(publicKey: PublicKey): publicKey is MultiEd25519PublicKey {
  return publicKey instanceof MultiEd25519PublicKey || ('publicKeys' in publicKey && 'threshold' in publicKey);
}

function isMultiKey(publicKey: PublicKey): publicKey is MultiKey {
  return publicKey instanceof MultiKey || MultiKey.isInstance(publicKey);
}

function isAnySignature(signature: unknown): signature is AnySignature {
  return signature instanceof AnySignature
    || (typeof signature === 'object' && signature !== null && AnySignature.isInstance(signature as Signature));
}

function isMultiKeySignature(signature: unknown): signature is MultiKeySignature {
  return signature instanceof MultiKeySignature
    || (hasSignatureList(signature) && signature.signatures.every(isAnySignature));
}

function isMultiEd25519Signature(signature: unknown): signature is MultiEd25519Signature {
  return signature instanceof MultiEd25519Signature
    || (hasSignatureList(signature) && !isMultiKeySignature(signature));
}

function serializePublicKey(publicKey: PublicKey) {
  if (isEd25519PublicKey(publicKey)) {
    return { publicKeyKind: 'ed25519' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  if (isSecp256k1PublicKey(publicKey)) {
    return { publicKeyKind: 'secp256k1' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  if (isAnyPublicKey(publicKey)) {
    return { publicKeyKind: 'any' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  if (isMultiEd25519PublicKey(publicKey)) {
    return { publicKeyKind: 'multiEd25519' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  if (isMultiKey(publicKey)) {
    return { publicKeyKind: 'multiKey' as const, publicKeyBcs: publicKey.bcsToHex().toString() };
  }

  throw new Error('Unsupported wallet public key type');
}

function serializeSignature(signature: Signature, publicKeyKind: SerializedPublicKey['publicKeyKind']) {
  if (isAnySignature(signature)) {
    return { signatureKind: 'any' as const, signatureBcs: signature.bcsToHex().toString() };
  }

  if (isMultiKeySignature(signature)) {
    return { signatureKind: 'multiKey' as const, signatureBcs: signature.bcsToHex().toString() };
  }

  if (isMultiEd25519Signature(signature)) {
    return { signatureKind: 'multiEd25519' as const, signatureBcs: signature.bcsToHex().toString() };
  }

  if (signature instanceof Secp256k1Signature || (publicKeyKind === 'secp256k1' && hasBcsToHex(signature))) {
    return { signatureKind: 'secp256k1' as const, signatureBcs: signature.bcsToHex().toString() };
  }

  if (signature instanceof Ed25519Signature || hasBcsToHex(signature)) {
    return { signatureKind: 'ed25519' as const, signatureBcs: signature.bcsToHex().toString() };
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
  const serializedPublicKey = serializePublicKey(account.publicKey);
  const serializedSignature = serializeSignature(signedMessage.signature, serializedPublicKey.publicKeyKind);

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
      ...serializedPublicKey,
      ...serializedSignature,
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
