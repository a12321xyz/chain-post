'use client';

import { useEffect, useState } from 'react';
import { PenLine, Eye, Sparkles, Hash, X } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { categories } from '@/lib/mock-data';
import { Author, Post, ShelbyUploadStatus } from '@/lib/types';
import { ensureWalletSession } from '@/lib/wallet-auth-client';
import {
  publishPostContentToShelby,
  ShelbyContentUploadError,
  type PublishShelbyPostResult,
} from '@/lib/shelby-client';
import { getShelbyApiKey } from '@/lib/shelby';

export default function WritePage() {
  const { connected, account, signMessage, signAndSubmitTransaction } = useWallet();
  const walletAddress = account?.address.toString() ?? '';
  const shelbyConfigured = getShelbyApiKey().length > 0;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState('Tutorial');
  const [preview, setPreview] = useState(false);
  const [storeOnShelby, setStoreOnShelby] = useState(shelbyConfigured);
  const [publishing, setPublishing] = useState(false);
  const [publishedPost, setPublishedPost] = useState<Post | null>(null);
  const [publishedStorageMode, setPublishedStorageMode] = useState<'blob' | 'memory' | null>(null);
  const [profile, setProfile] = useState<Author | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [publishNotice, setPublishNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!walletAddress) {
        if (!cancelled) {
          setProfile(null);
        }
        return;
      }

      if (!cancelled) {
        setProfileLoading(true);
      }
      try {
        const response = await fetch(`/api/profile?wallet=${encodeURIComponent(walletAddress)}`, { cache: 'no-store' });
        const data = await response.json();
        if (!cancelled) {
          setProfile(data.profile ?? null);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() && tags.length < 5) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((entry) => entry !== tag));
  };

  const resetForm = () => {
    setPublishing(false);
    setPublishedPost(null);
    setPublishedStorageMode(null);
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setCategory('Tutorial');
    setPreview(false);
    setStoreOnShelby(shelbyConfigured);
    setStatus('');
    setPublishNotice('');
  };

  const handlePublish = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent || !walletAddress) return;

    if (trimmedTitle.length < 4) {
      setStatus('Title must be at least 4 characters.');
      return;
    }

    if (trimmedContent.length < 20) {
      setStatus('Post body must be at least 20 characters.');
      return;
    }

    setPublishing(true);
    setStatus('');
    setPublishNotice('');
    let shelbyMetadata: PublishShelbyPostResult | null = null;

    async function savePost(metadata: (PublishShelbyPostResult & { shelbyUploadStatus?: ShelbyUploadStatus }) | null) {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          title: trimmedTitle,
          content: trimmedContent,
          category,
          tags,
          isOnChain: metadata !== null,
          ...metadata,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Could not publish post');
      }

      setPublishedPost(data.post as Post);
      setPublishedStorageMode((data.storageMode ?? null) as 'blob' | 'memory' | null);
      return data.post as Post;
    }

    try {
      await ensureWalletSession({
        walletAddress,
        account,
        signMessage,
      });

      if (storeOnShelby) {
        shelbyMetadata = await publishPostContentToShelby({
          walletAddress,
          title: trimmedTitle,
          content: trimmedContent,
          category,
          tags,
          signAndSubmitTransaction,
          onStatus: setStatus,
        });
      }

      setStatus('Saving feed metadata...');
      await savePost(shelbyMetadata);
    } catch (error) {
      if (error instanceof ShelbyContentUploadError) {
        try {
          setStatus('Shelby registration succeeded, but content upload failed. Saving a fallback copy...');
          await savePost({ ...error.metadata, shelbyUploadStatus: 'pending' });
          setPublishNotice(`Shelby registered the blob, but RPC content upload did not finalize. A fallback copy was saved in the app cache. Shelby tx: ${error.metadata.txHash}`);
          return;
        } catch (fallbackError) {
          setStatus(
            `Shelby registration succeeded, but content upload failed and fallback save failed: ${
              fallbackError instanceof Error ? fallbackError.message : 'Could not save fallback post'
            }. Shelby tx: ${error.metadata.txHash}`
          );
          return;
        }
      }

      const message = error instanceof Error ? error.message : 'Could not publish post';
      setStatus(
        shelbyMetadata
          ? `Shelby upload succeeded, but feed metadata was not saved: ${message}. Storage ref: ${shelbyMetadata.storageRef}`
          : message
      );
    } finally {
      setPublishing(false);
    }
  };

  if (publishedPost) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container-narrow animate-fadeIn">
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '2rem',
          }}>
            ✨
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
            Published <span className="gradient-text">Successfully</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 8, fontSize: '1.05rem' }}>
            {publishedPost.storageProvider === 'shelby' && publishedPost.shelbyUploadStatus === 'pending'
              ? 'Shelby registration succeeded, but RPC content upload is still pending. A fallback copy is live from the app cache.'
              : publishedPost.storageProvider === 'shelby'
              ? 'Markdown content was stored on Shelby. ChainPost cached feed metadata so readers can discover it.'
              : publishedStorageMode === 'memory'
              ? 'Your post was saved in demo memory for this server instance only and may reset.'
              : 'Your post is live in the ChainPost feed with content stored in the app metadata cache.'}
          </p>
          {publishNotice && (
            <p style={{ color: '#fbbf24', margin: '12px auto 0', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 620 }}>
              {publishNotice}
            </p>
          )}

          <div className="glass-card" style={{ padding: 20, marginTop: 24, maxWidth: 520, margin: '24px auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Status</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {publishedPost.storageProvider === 'shelby'
                    ? publishedPost.shelbyUploadStatus === 'pending'
                      ? 'Shelby Pending'
                      : 'Shelby Stored'
                    : publishedStorageMode === 'memory'
                      ? 'Memory Only'
                      : 'Metadata Cached'}
                </span>
              </div>
              {publishedPost.storageProvider === 'shelby' && publishedPost.txHash && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                  border: '1px solid var(--color-border-subtle)',
                  gap: 12,
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Shelby Tx</span>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-cyan)' }}>
                    {publishedPost.txHash.slice(0, 18)}...{publishedPost.txHash.slice(-8)}
                  </span>
                </div>
              )}
              {publishedPost.storageProvider === 'shelby' && publishedPost.storageRef && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                  border: '1px solid var(--color-border-subtle)',
                  gap: 4,
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Storage Ref</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontFamily: 'var(--font-mono)', 
                    color: '#a78bfa',
                    wordBreak: 'break-all',
                    textAlign: 'left',
                    lineHeight: 1.4
                  }}>
                    {publishedPost.storageRef}
                  </span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Slug</span>
                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-cyan)' }}>
                  /post/{publishedPost.slug}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Wallet</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{walletAddress}</span>
              </div>
            </div>
          </div>

          {publishedStorageMode === 'memory' && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Memory mode is only a local fallback. Shelby-backed posts keep markdown content outside this cache.
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <Link href={`/post/${publishedPost.slug}`} className="btn-primary" style={{ textDecoration: 'none' }}>
              <span>Read Post</span>
            </Link>
            <button className="btn-secondary" onClick={resetForm} type="button">
              Write Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container-narrow">
        <div className="animate-fadeIn" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
            <PenLine size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            Write a <span className="gradient-text">Post</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Publish markdown posts from your connected wallet profile.
          </p>
        </div>

        {!connected ? (
          <div className="glass-card animate-fadeIn animate-delay-1" style={{ padding: 28, textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Connect an Aptos wallet from the top navigation to start publishing.
            </p>
            <Link href="/profile" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <span>Open Profile Setup</span>
            </Link>
          </div>
        ) : profileLoading ? (
          <div className="glass-card animate-fadeIn animate-delay-1" style={{ padding: 28 }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Checking your creator profile...</p>
          </div>
        ) : !profile ? (
          <div className="glass-card animate-fadeIn animate-delay-1" style={{ padding: 28 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>Create your profile first</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Your wallet is connected, but you still need a display name and bio before publishing.
            </p>
            <Link href="/profile" className="btn-primary" style={{ textDecoration: 'none' }}>
              <span>Set Up Profile</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="glass-card animate-fadeIn animate-delay-1" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  {profile.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{profile.name}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                    {profile.walletAddress}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card animate-fadeIn animate-delay-1" style={{ padding: 32, marginBottom: 24 }}>
              <input
                type="text"
                className="input"
                placeholder="Enter your post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  padding: '16px',
                  marginBottom: 20,
                  background: 'transparent',
                  border: '1px solid var(--color-border-subtle)',
                  letterSpacing: '-0.01em',
                }}
                id="post-title-input"
              />

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8, display: 'block' }}>
                  Category
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {categories.filter((item) => item !== 'All').map((item) => (
                    <button
                      key={item}
                      className={`tag ${item === category ? 'active' : ''}`}
                      onClick={() => setCategory(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8, display: 'block' }}>
                  Tags (max 5) — press Enter to add
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {tags.map((tag) => (
                    <span key={tag} className="tag active" style={{ gap: 6 }}>
                      <Hash size={10} />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                {tags.length < 5 && (
                  <input
                    type="text"
                    className="input"
                    placeholder="Type a tag and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    style={{ maxWidth: 300 }}
                  />
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                padding: 4,
                width: 'fit-content',
                border: '1px solid var(--color-border-subtle)',
              }}>
                <button
                  className="btn-ghost"
                  onClick={() => setPreview(false)}
                  type="button"
                  style={{
                    background: !preview ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    color: !preview ? '#a78bfa' : 'var(--color-text-muted)',
                    borderRadius: 8,
                    fontWeight: !preview ? 600 : 400,
                  }}
                >
                  <PenLine size={14} />
                  Write
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => setPreview(true)}
                  type="button"
                  style={{
                    background: preview ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    color: preview ? '#a78bfa' : 'var(--color-text-muted)',
                    borderRadius: 8,
                    fontWeight: preview ? 600 : 400,
                  }}
                >
                  <Eye size={14} />
                  Preview
                </button>
              </div>

              {!preview ? (
                <textarea
                  className="textarea"
                  placeholder="Write your post in markdown...&#10;&#10;# My First Post&#10;&#10;Hello, **Aptos builders!**"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  id="post-content-editor"
                />
              ) : (
                <div style={{
                  minHeight: 300,
                  padding: 20,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--color-border-subtle)',
                }}>
                  {content ? (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: 100 }}>
                      Nothing to preview yet. Start writing!
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="glass-card animate-fadeIn animate-delay-2" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={storeOnShelby}
                  onChange={(e) => setStoreOnShelby(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-accent-purple)' }}
                />
                <span style={{ fontWeight: 600 }}>Store markdown on Shelby</span>
              </label>
              <div style={{ flex: 1 }} />
              <span className={`badge ${shelbyConfigured ? 'badge-purple' : 'badge-pink'}`} style={{ fontSize: '0.75rem' }}>
                {storeOnShelby
                  ? shelbyConfigured
                    ? 'Wallet signs Shelby registration'
                    : 'Shelby API key needed'
                  : 'Inline fallback'}
              </span>
            </div>

            <div className="animate-fadeIn animate-delay-2" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot" style={{ width: 6, height: 6 }} />
                {storeOnShelby ? 'Publishing to Shelby' : 'Publishing to app cache'} from {profile.name}
              </div>
              <button
                className="btn-primary"
                onClick={handlePublish}
                disabled={!title.trim() || !content.trim() || publishing || (storeOnShelby && !shelbyConfigured)}
                type="button"
                style={{
                  opacity: (!title.trim() || !content.trim() || publishing || (storeOnShelby && !shelbyConfigured)) ? 0.5 : 1,
                  cursor: (!title.trim() || !content.trim() || publishing || (storeOnShelby && !shelbyConfigured)) ? 'not-allowed' : 'pointer',
                }}
                id="publish-button"
              >
                {publishing ? (
                  <>
                    <span className="spinner" style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{storeOnShelby ? 'Publish to Shelby' : 'Publish Fallback'}</span>
                  </>
                )}
              </button>
            </div>

            {status && (
              <p style={{ marginTop: 16, color: publishing ? 'var(--color-text-secondary)' : '#fda4af', fontSize: '0.9rem' }}>{status}</p>
            )}
            {storeOnShelby && !shelbyConfigured && (
              <p style={{ marginTop: 16, color: '#fda4af', fontSize: '0.9rem' }}>
                Set `NEXT_PUBLIC_SHELBY_API_KEY` to enable Shelby publishing, or uncheck Shelby for the local fallback.
              </p>
            )}

            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}
