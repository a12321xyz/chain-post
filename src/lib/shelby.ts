import { Network } from '@aptos-labs/ts-sdk';

export const SHELBY_POST_SCHEMA = 'chainpost.post.v1';
export const SHELBY_POST_TTL_DAYS = 365;

export interface ShelbyPostBlob {
  schema: typeof SHELBY_POST_SCHEMA;
  title: string;
  content: string;
  authorWallet: string;
  category: string;
  tags: string[];
  createdAt: string;
}

export interface ShelbyStorageReference {
  network: string;
  account: string;
  blobName: string;
}

export function getConfiguredAptosNetwork() {
  const configuredNetwork = process.env.NEXT_PUBLIC_APTOS_NETWORK?.toLowerCase();

  switch (configuredNetwork) {
    case 'mainnet':
      return Network.MAINNET;
    case 'devnet':
      return Network.DEVNET;
    case 'testnet':
      return Network.TESTNET;
    case 'shelbynet':
      return Network.SHELBYNET;
    default:
      return Network.SHELBYNET;
  }
}

export function getShelbyApiKey() {
  return process.env.NEXT_PUBLIC_SHELBY_API_KEY?.trim() ?? '';
}

export function getAptosApiKey() {
  return process.env.NEXT_PUBLIC_APTOS_API_KEY?.trim() ?? '';
}

export function createShelbyStorageRef({ network, account, blobName }: ShelbyStorageReference) {
  return `shelby://${network}/${account}/${blobName}`;
}

export function parseShelbyStorageRef(storageRef: string | undefined): ShelbyStorageReference | null {
  if (!storageRef?.startsWith('shelby://')) return null;

  const withoutProtocol = storageRef.slice('shelby://'.length);
  const [network, account, ...blobNameParts] = withoutProtocol.split('/');
  const blobName = blobNameParts.join('/');

  if (!network || !account || !blobName) return null;
  return { network, account, blobName };
}

export function readShelbyPostContent(raw: string) {
  try {
    const parsed = JSON.parse(raw) as Partial<ShelbyPostBlob>;
    if (parsed.schema === SHELBY_POST_SCHEMA && typeof parsed.content === 'string') {
      return parsed.content;
    }
  } catch {
    // Older or manually uploaded Shelby blobs may be plain markdown.
  }

  return raw;
}
