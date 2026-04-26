'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import PostCard from '@/components/PostCard';
import { Author, Post } from '@/lib/types';
import { formatWalletAddress } from '@/lib/utils';
import { ensureWalletSession } from '@/lib/wallet-auth-client';

export default function ProfilePage() {
  const { connected, account, signMessage } = useWallet();
  const walletAddress = account?.address.toString() ?? '';

  const [profile, setProfile] = useState<Author | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('🧑‍💻');
  const [storageMode, setStorageMode] = useState<'blob' | 'memory' | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!walletAddress) {
        if (!cancelled) {
          setProfile(null);
          setPosts([]);
          setName('');
          setBio('');
          setAvatar('🧑‍💻');
          setStorageMode(null);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setMessage('');
      }

      try {
        const [profileResponse, postsResponse] = await Promise.all([
          fetch(`/api/profile?wallet=${encodeURIComponent(walletAddress)}`, { cache: 'no-store' }),
          fetch(`/api/posts?wallet=${encodeURIComponent(walletAddress)}`, { cache: 'no-store' }),
        ]);

        const profileData = await profileResponse.json();
        const postsData = await postsResponse.json();

        const nextProfile = (profileData.profile ?? null) as Author | null;
        if (!cancelled) {
          setProfile(nextProfile);
          setPosts((postsData.posts ?? []) as Post[]);
          setName(nextProfile?.name ?? `Writer ${formatWalletAddress(walletAddress, 6, 3)}`);
          setBio(nextProfile?.bio ?? '');
          setAvatar(nextProfile?.avatar ?? '🧑‍💻');
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
          setPosts([]);
          setName(`Writer ${formatWalletAddress(walletAddress, 6, 3)}`);
          setBio('');
          setAvatar('🧑‍💻');
          setStorageMode(null);
          setMessage('Could not load your profile right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  async function handleSave() {
    if (!walletAddress || !name.trim()) {
      setMessage('Display name is required.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await ensureWalletSession({
        walletAddress,
        account,
        signMessage,
      });

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          name,
          bio,
          avatar,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Could not save profile');
      }

      setProfile(data.profile as Author);
      setStorageMode((data.storageMode ?? null) as 'blob' | 'memory' | null);
      setMessage(
        data.storageMode === 'memory'
          ? 'Your profile is loaded in memory mode.'
          : 'Your profile metadata has been saved to Vercel Blob.'
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  if (!connected) {
    return (
      <div style={{ padding: '56px 0' }}>
        <div className="container-narrow">
          <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>
              Connect a wallet to create your profile
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Use the wallet button in the navigation bar, then come back here to set your display name and bio.
            </p>
            <Link href="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px 0' }}>
      <div className="container-page">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 420px) 1fr', gap: 28, alignItems: 'start' }} className="profile-grid">
          <div className="glass-card" style={{ padding: 28 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 10 }}>Creator Profile</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Set up the public profile tied to your connected Aptos wallet.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Wallet
              </label>
              <div className="input" style={{ fontFamily: 'var(--font-mono)' }}>{walletAddress}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Display Name
              </label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Avatar Emoji
              </label>
              <input className="input" value={avatar} onChange={(e) => setAvatar(e.target.value)} maxLength={4} style={{ maxWidth: 120 }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Bio
              </label>
              <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} style={{ minHeight: 160 }} />
            </div>

            <button className="btn-primary" type="button" onClick={handleSave} disabled={saving || loading}>
              <span>{saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}</span>
            </button>

            {message && (
              <p style={{ marginTop: 14, color: message.includes('saved') ? '#86efac' : '#fda4af', fontSize: '0.9rem' }}>
                {message}
              </p>
            )}

            {storageMode === 'memory' && !message && (
              <p style={{ marginTop: 14, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Demo mode: profile data is only stored in server memory and may reset.
              </p>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6 }}>Your Posts</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {loading ? 'Loading your content...' : `${posts.length} post${posts.length === 1 ? '' : 's'} published`}
                </p>
              </div>
              <Link href="/write" className="btn-secondary" style={{ textDecoration: 'none' }}>
                <span>Write New Post</span>
              </Link>
            </div>

            {posts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
                {posts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} />
                ))}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: 28 }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                  No posts yet. Create your profile, then publish your first markdown post.
                </p>
                <Link href="/write" className="btn-primary" style={{ textDecoration: 'none' }}>
                  <span>Start Writing</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 960px) {
            .profile-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
