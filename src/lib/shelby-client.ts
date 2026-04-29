import type { AptosSignAndSubmitTransactionOutput, InputTransactionData } from '@aptos-labs/wallet-adapter-core';
import { AccountAddress, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import type { Post } from './types';
import {
  createDefaultErasureCodingProvider,
  defaultErasureCodingConfig,
  expectedTotalChunksets,
  generateCommitments,
  ShelbyBlobClient,
  ShelbyRPCClient,
  type ShelbyClientConfig,
  type ShelbyNetwork,
} from '@shelby-protocol/sdk/browser';
import { slugify } from './utils';
import {
  createShelbyStorageRef,
  getAptosApiKey,
  getConfiguredAptosNetwork,
  getShelbyApiKey,
  parseShelbyStorageRef,
  readShelbyPostContent,
  SHELBY_POST_SCHEMA,
  SHELBY_POST_TTL_DAYS,
  type ShelbyPostBlob,
} from './shelby';

type SignAndSubmitTransaction = (transaction: InputTransactionData) => Promise<AptosSignAndSubmitTransactionOutput>;

interface PublishShelbyPostInput {
  walletAddress: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  signAndSubmitTransaction: SignAndSubmitTransaction;
  onStatus?: (status: string) => void;
}

export interface PublishShelbyPostResult {
  storageProvider: 'shelby';
  storageRef: string;
  storageAccount: string;
  storageBlobName: string;
  storageNetwork: string;
  txHash: string;
}

export class ShelbyContentUploadError extends Error {
  constructor(
    message: string,
    readonly metadata: PublishShelbyPostResult,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'ShelbyContentUploadError';
  }
}

function assertShelbyNetwork(network: Network): asserts network is ShelbyNetwork {
  if (network !== Network.SHELBYNET && network !== Network.TESTNET) {
    throw new Error('Shelby storage requires NEXT_PUBLIC_APTOS_NETWORK=shelbynet or testnet.');
  }
}

function getShelbyClientConfig(network: ShelbyNetwork): ShelbyClientConfig {
  const shelbyApiKey = getShelbyApiKey();
  const aptosApiKey = getAptosApiKey();

  if (!shelbyApiKey) {
    throw new Error('Set NEXT_PUBLIC_SHELBY_API_KEY before publishing to Shelby.');
  }

  return {
    network,
    apiKey: shelbyApiKey,
    aptos: aptosApiKey
      ? {
          clientConfig: {
            API_KEY: aptosApiKey,
          },
        }
      : undefined,
  };
}

function networkFromName(networkName: string | undefined): ShelbyNetwork {
  switch (networkName?.toLowerCase()) {
    case 'testnet':
      return Network.TESTNET;
    case 'shelbynet':
      return Network.SHELBYNET;
    default:
      break;
  }

  const configuredNetwork = getConfiguredAptosNetwork();
  assertShelbyNetwork(configuredNetwork);
  return configuredNetwork;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyShelbyBlobAvailable(rpc: ShelbyRPCClient, account: AccountAddress, blobName: string) {
  try {
    const blob = await rpc.getBlob({ account, blobName });
    await new Response(blob.readable).arrayBuffer();
    return true;
  } catch {
    return false;
  }
}

function cleanShelbyUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Failed to complete multipart upload')) {
    return 'Shelby RPC could not finalize the content upload right now.';
  }

  if (message.includes('Failed to upload part')) {
    return 'Shelby RPC could not receive the content upload right now.';
  }

  return message || 'Shelby content upload failed.';
}

async function putBlobWithRetry({
  rpc,
  account,
  blobName,
  blobData,
  onStatus,
}: {
  rpc: ShelbyRPCClient;
  account: AccountAddress;
  blobName: string;
  blobData: Uint8Array;
  onStatus?: (status: string) => void;
}) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      onStatus?.(attempt === 1 ? 'Uploading markdown bytes to Shelby...' : `Retrying Shelby upload (${attempt}/3)...`);
      await rpc.putBlob({
        account,
        blobName,
        blobData,
      });
      return;
    } catch (error) {
      lastError = error;

      onStatus?.('Checking whether Shelby stored the content...');
      if (await verifyShelbyBlobAvailable(rpc, account, blobName)) {
        return;
      }

      if (attempt < 3) {
        await wait(attempt * 1200);
      }
    }
  }

  throw new Error(cleanShelbyUploadError(lastError), { cause: lastError });
}

export async function fetchShelbyPostContentInBrowser(post: Post) {
  const parsedRef = parseShelbyStorageRef(post.storageRef);
  const account = post.storageAccount ?? parsedRef?.account;
  const blobName = post.storageBlobName ?? parsedRef?.blobName;

  if (!account || !blobName) return undefined;

  const network = networkFromName(post.storageNetwork ?? parsedRef?.network);
  const rpc = new ShelbyRPCClient(getShelbyClientConfig(network));
  const blob = await rpc.getBlob({
    account: AccountAddress.from(account),
    blobName,
  });
  const raw = await new Response(blob.readable).text();

  return readShelbyPostContent(raw);
}

export async function publishPostContentToShelby({
  walletAddress,
  title,
  content,
  category,
  tags,
  signAndSubmitTransaction,
  onStatus,
}: PublishShelbyPostInput): Promise<PublishShelbyPostResult> {
  const network = getConfiguredAptosNetwork();
  assertShelbyNetwork(network);

  const config = getShelbyClientConfig(network);
  const account = AccountAddress.from(walletAddress);
  const createdAt = new Date().toISOString();
  const blobName = `chainpost/posts/${slugify(title)}-${crypto.randomUUID()}.json`;
  const payload: ShelbyPostBlob = {
    schema: SHELBY_POST_SCHEMA,
    title,
    content,
    authorWallet: account.toString(),
    category,
    tags,
    createdAt,
  };
  const blobData = new TextEncoder().encode(JSON.stringify(payload));

  onStatus?.('Generating Shelby commitments...');
  const provider = await createDefaultErasureCodingProvider();
  const commitments = await generateCommitments(provider, blobData);
  const erasureConfig = defaultErasureCodingConfig();
  const chunksetSize = erasureConfig.chunkSizeBytes * erasureConfig.erasure_k;
  const expirationMicros = (Date.now() + SHELBY_POST_TTL_DAYS * 24 * 60 * 60 * 1000) * 1000;

  onStatus?.('Requesting wallet signature for Shelby registration...');
  const transaction = await signAndSubmitTransaction({
    sender: account,
    data: ShelbyBlobClient.createRegisterBlobPayload({
      account,
      blobName,
      blobSize: blobData.length,
      blobMerkleRoot: commitments.blob_merkle_root,
      expirationMicros,
      numChunksets: expectedTotalChunksets(blobData.length, chunksetSize),
      encoding: erasureConfig.enumIndex,
    }),
  });

  const txHash = transaction.hash;
  const metadata: PublishShelbyPostResult = {
    storageProvider: 'shelby',
    storageRef: createShelbyStorageRef({
      network,
      account: account.toString(),
      blobName,
    }),
    storageAccount: account.toString(),
    storageBlobName: blobName,
    storageNetwork: network,
    txHash,
  };

  onStatus?.('Waiting for Shelby registration transaction...');
  const aptosApiKey = getAptosApiKey() || getShelbyApiKey();
  const aptos = new Aptos(
    new AptosConfig({
      network,
      clientConfig: aptosApiKey ? { API_KEY: aptosApiKey } : undefined,
    })
  );
  await aptos.waitForTransaction({
    transactionHash: txHash,
    options: {
      timeoutSecs: 60,
      checkSuccess: true,
    },
  });

  const rpc = new ShelbyRPCClient(config);

  try {
    await putBlobWithRetry({ rpc, account, blobName, blobData, onStatus });
  } catch (error) {
    throw new ShelbyContentUploadError(
      error instanceof Error ? error.message : 'Shelby content upload failed.',
      metadata,
      { cause: error }
    );
  }

  return metadata;
}
