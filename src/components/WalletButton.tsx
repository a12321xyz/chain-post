'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ChevronDown, Wallet, LogOut, UserRound } from 'lucide-react';
import { formatWalletAddress } from '@/lib/utils';
import { clearWalletSession } from '@/lib/wallet-auth-client';

export default function WalletButton() {
  const { connect, connected, disconnect, account, wallet, wallets, notDetectedWallets, isLoading, network } = useWallet();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const installedWallets = useMemo(
    () => wallets.filter((entry) => entry.readyState !== 'NotDetected'),
    [wallets]
  );

  async function handleConnect(walletName: string) {
    try {
      setError('');
      connect(walletName);
      setOpen(false);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Could not connect wallet');
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        className={connected ? 'btn-secondary' : 'btn-primary'}
        onClick={() => setOpen((value) => !value)}
        type="button"
        style={{
          textDecoration: 'none',
          padding: connected ? '10px 16px' : undefined,
          minWidth: 150,
          justifyContent: 'center',
        }}
      >
        <Wallet size={16} />
        <span>
          {connected && account
            ? formatWalletAddress(account.address.toString())
            : isLoading
              ? 'Loading...'
              : 'Connect Wallet'}
        </span>
        <ChevronDown size={15} />
      </button>

      {open && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: 280,
            padding: 14,
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {connected && account ? (
            <>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  Connected wallet
                </div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{formatWalletAddress(account.address.toString(), 10, 6)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {wallet?.name ?? 'Aptos wallet'} on {network?.name ?? 'unknown network'}
                </div>
              </div>

              <Link
                href="/profile"
                className="btn-ghost"
                style={{ justifyContent: 'flex-start', textDecoration: 'none' }}
                onClick={() => setOpen(false)}
              >
                <UserRound size={15} />
                Profile
              </Link>

              <button
                className="btn-ghost"
                type="button"
                onClick={async () => {
                  await clearWalletSession();
                  disconnect();
                  setOpen(false);
                }}
                style={{ justifyContent: 'flex-start' }}
              >
                <LogOut size={15} />
                Disconnect
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Choose an installed Aptos wallet to create a profile and publish posts.
              </div>

              {installedWallets.length > 0 ? (
                installedWallets.map((entry) => (
                  <button
                    key={entry.name}
                    className="btn-secondary"
                    type="button"
                    onClick={() => handleConnect(entry.name)}
                    style={{ justifyContent: 'space-between', width: '100%' }}
                  >
                    <span>{entry.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Installed</span>
                  </button>
                ))
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  No compatible wallet detected.
                </div>
              )}

              {notDetectedWallets.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Install a wallet</div>
                  {notDetectedWallets.slice(0, 3).map((entry) => (
                    <a
                      key={entry.name}
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ justifyContent: 'flex-start', textDecoration: 'none' }}
                    >
                      {entry.name}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}

          {error && (
            <p style={{ color: '#fda4af', fontSize: '0.75rem' }}>{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
