'use client';

import { ReactNode } from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';

function getNetwork() {
  const configuredNetwork = process.env.NEXT_PUBLIC_APTOS_NETWORK?.toLowerCase();

  switch (configuredNetwork) {
    case 'mainnet':
      return Network.MAINNET;
    case 'devnet':
      return Network.DEVNET;
    default:
      return Network.TESTNET;
  }
}

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  return (
    <AptosWalletAdapterProvider
      autoConnect
      dappConfig={{ network: getNetwork() }}
      onError={(error) => {
        console.error('Wallet adapter error', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
