import { cookies } from 'next/headers';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import {
  AccountAddress,
  type AccountPublicKey,
  AnyPublicKey,
  AnySignature,
  Deserializer,
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

export const SESSION_COOKIE_NAME = 'chainpost_session';
export const CHALLENGE_COOKIE_NAME = 'chainpost_auth_challenge';

const CHALLENGE_MAX_AGE_SECONDS = 60 * 5;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const PUBLIC_KEY_KINDS = ['ed25519', 'secp256k1', 'any', 'multiEd25519', 'multiKey'] as const;
export const SIGNATURE_KINDS = ['ed25519', 'secp256k1', 'any', 'multiEd25519', 'multiKey'] as const;

export type PublicKeyKind = (typeof PUBLIC_KEY_KINDS)[number];
export type SignatureKind = (typeof SIGNATURE_KINDS)[number];

interface SignedCookiePayload {
  walletAddress: string;
  nonce?: string;
  message?: string;
  issuedAt: string;
  expiresAt: string;
}

export interface AuthChallenge {
  walletAddress: string;
  nonce: string;
  message: string;
  issuedAt: string;
  expiresAt: string;
}

export interface SerializedSignedChallenge {
  walletAddress: string;
  fullMessage: string;
  message: string;
  nonce: string;
  signedAddress: string;
  publicKeyKind: PublicKeyKind;
  publicKeyBcs: string;
  signatureKind: SignatureKind;
  signatureBcs: string;
}

function getAuthSecret() {
  const configuredSecret = process.env.AUTH_SECRET;
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV !== 'production') {
    return 'chainpost-development-auth-secret';
  }

  throw new Error('AUTH_SECRET is required in production');
}

export function normalizeWalletAddress(address: string) {
  return AccountAddress.from(address).toString();
}

export function isValidWalletAddress(address: string) {
  try {
    normalizeWalletAddress(address);
    return true;
  } catch {
    return false;
  }
}

function encodePayload(payload: SignedCookiePayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodePayload<T>(encoded: string) {
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T;
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', getAuthSecret()).update(encodedPayload).digest('base64url');
}

function createSignedValue(payload: SignedCookiePayload) {
  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function verifySignedValue<T>(value: string | undefined) {
  if (!value) return null;

  const [encodedPayload, signature] = value.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const providedBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return decodePayload<T>(encodedPayload);
  } catch {
    return null;
  }
}

export function createAuthChallenge(walletAddress: string): AuthChallenge {
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CHALLENGE_MAX_AGE_SECONDS * 1000).toISOString();
  const nonce = randomUUID();
  const message = `Authenticate with ChainPost as ${normalizedWalletAddress}. Nonce: ${nonce}. Expires: ${expiresAt}.`;

  return {
    walletAddress: normalizedWalletAddress,
    nonce,
    message,
    issuedAt,
    expiresAt,
  };
}

export async function setAuthChallengeCookie(challenge: AuthChallenge) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: CHALLENGE_COOKIE_NAME,
    value: createSignedValue(challenge),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CHALLENGE_MAX_AGE_SECONDS,
  });
}

export async function consumeAuthChallenge(walletAddress: string) {
  const cookieStore = await cookies();
  const payload = verifySignedValue<AuthChallenge>(cookieStore.get(CHALLENGE_COOKIE_NAME)?.value);

  cookieStore.delete(CHALLENGE_COOKIE_NAME);

  if (!payload) return null;
  if (new Date(payload.expiresAt).getTime() <= Date.now()) return null;

  try {
    if (payload.walletAddress !== normalizeWalletAddress(walletAddress)) {
      return null;
    }
  } catch {
    return null;
  }

  return payload;
}

export async function createWalletSession(walletAddress: string) {
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: createSignedValue({ walletAddress: normalizedWalletAddress, issuedAt, expiresAt }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getWalletSession() {
  const cookieStore = await cookies();
  const payload = verifySignedValue<SignedCookiePayload>(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!payload) return null;
  if (new Date(payload.expiresAt).getTime() <= Date.now()) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    walletAddress: payload.walletAddress,
    expiresAt: payload.expiresAt,
  };
}

export async function clearWalletSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(CHALLENGE_COOKIE_NAME);
}

export async function requireWalletSession(walletAddress: string) {
  try {
    const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
    const session = await getWalletSession();
    return session?.walletAddress === normalizedWalletAddress;
  } catch {
    return false;
  }
}

function deserializePublicKey(kind: PublicKeyKind, bcsHex: string): PublicKey {
  const deserializer = Deserializer.fromHex(bcsHex);

  switch (kind) {
    case 'ed25519':
      return Ed25519PublicKey.deserialize(deserializer);
    case 'secp256k1':
      return Secp256k1PublicKey.deserialize(deserializer);
    case 'any':
      return AnyPublicKey.deserialize(deserializer);
    case 'multiEd25519':
      return MultiEd25519PublicKey.deserialize(deserializer);
    case 'multiKey':
      return MultiKey.deserialize(deserializer);
  }
}

function deserializeSignature(kind: SignatureKind, bcsHex: string): Signature {
  const deserializer = Deserializer.fromHex(bcsHex);

  switch (kind) {
    case 'ed25519':
      return Ed25519Signature.deserialize(deserializer);
    case 'secp256k1':
      return Secp256k1Signature.deserialize(deserializer);
    case 'any':
      return AnySignature.deserialize(deserializer);
    case 'multiEd25519':
      return MultiEd25519Signature.deserialize(deserializer);
    case 'multiKey':
      return MultiKeySignature.deserialize(deserializer);
  }
}

function isAccountPublicKey(publicKey: PublicKey): publicKey is AccountPublicKey {
  return publicKey instanceof Ed25519PublicKey
    || publicKey instanceof AnyPublicKey
    || publicKey instanceof MultiEd25519PublicKey
    || publicKey instanceof MultiKey;
}

function deriveWalletAddressFromPublicKey(publicKey: PublicKey) {
  if (!isAccountPublicKey(publicKey)) return null;
  return publicKey.authKey().derivedAddress().toString();
}

export function verifySignedChallengePayload(payload: SerializedSignedChallenge, challenge: AuthChallenge) {
  let normalizedWalletAddress: string;
  let normalizedSignedAddress: string;

  try {
    normalizedWalletAddress = normalizeWalletAddress(payload.walletAddress);
    normalizedSignedAddress = normalizeWalletAddress(payload.signedAddress);
  } catch {
    return false;
  }

  if (normalizedWalletAddress !== challenge.walletAddress) return false;
  if (normalizedSignedAddress !== challenge.walletAddress) return false;
  if (payload.message !== challenge.message) return false;
  if (payload.nonce !== challenge.nonce) return false;
  if (!payload.fullMessage.includes(challenge.message)) return false;
  if (!payload.fullMessage.includes(challenge.nonce)) return false;

  try {
    const publicKey = deserializePublicKey(payload.publicKeyKind, payload.publicKeyBcs) as {
      verifySignature(args: { message: Uint8Array; signature: Signature }): boolean;
    } & PublicKey;
    const derivedWalletAddress = deriveWalletAddressFromPublicKey(publicKey);

    if (derivedWalletAddress !== challenge.walletAddress) return false;

    const signature = deserializeSignature(payload.signatureKind, payload.signatureBcs);
    const signingMessage = new TextEncoder().encode(payload.fullMessage);

    return publicKey.verifySignature({ message: signingMessage, signature });
  } catch {
    return false;
  }
}
