import { AccountAddress, Network } from '@aptos-labs/ts-sdk';
import { ShelbyRPCClient, type ShelbyClientConfig, type ShelbyNetwork } from '@shelby-protocol/sdk/node';
import { Post } from './types';
import {
  getAptosApiKey,
  getConfiguredAptosNetwork,
  getShelbyApiKey,
  parseShelbyStorageRef,
  readShelbyPostContent,
} from './shelby';

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
  if (configuredNetwork === Network.TESTNET || configuredNetwork === Network.SHELBYNET) {
    return configuredNetwork;
  }

  return Network.SHELBYNET;
}

function getShelbyClientConfig(network: ShelbyNetwork): ShelbyClientConfig {
  const shelbyApiKey = getShelbyApiKey();
  const aptosApiKey = getAptosApiKey();

  return {
    network,
    apiKey: shelbyApiKey || undefined,
    aptos: aptosApiKey
      ? {
          clientConfig: {
            API_KEY: aptosApiKey,
          },
        }
      : undefined,
  };
}

export async function fetchShelbyPostContent(post: Post) {
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
