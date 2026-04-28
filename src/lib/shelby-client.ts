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

  onStatus?.('Uploading markdown bytes to Shelby...');
  const rpc = new ShelbyRPCClient(config);
  await rpc.putBlob({
    account,
    blobName,
    blobData,
  });

  return {
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
}
