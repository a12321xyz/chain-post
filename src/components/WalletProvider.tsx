'use client';

import { ReactNode } from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { getConfiguredAptosNetwork } from '@/lib/shelby';

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  return (
    <AptosWalletAdapterProvider
      autoConnect
      dappConfig={{ network: getConfiguredAptosNetwork() }}
      onError={(error) => {
        console.error('Wallet adapter error', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
