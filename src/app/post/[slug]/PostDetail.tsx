'use client';

import { Post } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Heart, Eye, Clock, Hash, Share2, Check } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchShelbyPostContentInBrowser } from '@/lib/shelby-client';

interface PostDetailProps {
  post: Post;
}

export default function PostDetail({ post }: PostDetailProps) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [loadedContent, setLoadedContent] = useState(post.content ?? '');
  const [contentLoading, setContentLoading] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true });
  const dateFormatted = format(new Date(post.publishedAt), 'MMMM d, yyyy');
  const isShelbyPost = post.storageProvider === 'shelby';
  const metadataValueStyle = {
    fontSize: '0.8rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-accent-cyan)',
    minWidth: 0,
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
    textAlign: 'right' as const,
  };

  useEffect(() => {
    let cancelled = false;

    async function loadShelbyContent() {
      if (!isShelbyPost || loadedContent) return;

      setContentLoading(true);
      try {
        const content = await fetchShelbyPostContentInBrowser(post);
        if (!cancelled && content) {
          setLoadedContent(content);
        }
      } catch {
        if (!cancelled) {
          setLoadedContent('');
        }
      } finally {
        if (!cancelled) {
          setContentLoading(false);
        }
      }
    }

    void loadShelbyContent();

    return () => {
      cancelled = true;
    };
  }, [isShelbyPost, loadedContent, post]);

  const handleCopyLink = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }

      await navigator.clipboard.writeText(window.location.href);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  return (
    <div style={{ padding: '32px 0' }}>
      <div className="container-narrow">
        {/* Back button */}
        <Link href="/" className="btn-ghost animate-fadeIn" style={{
          textDecoration: 'none',
          marginBottom: 32,
          display: 'inline-flex',
        }}>
          <ArrowLeft size={16} />
          Back to Posts
        </Link>

        {/* Post Header */}
        <header className="animate-fadeIn animate-delay-1" style={{ marginBottom: 40 }}>
          {/* Category + Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span className="badge badge-purple">{post.category}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              {dateFormatted}
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} />
              {post.readTime} min read
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}>
            {post.title}
          </h1>

          {/* Excerpt */}
          <p style={{
            fontSize: '1.15rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            marginBottom: 24,
          }}>
            {post.excerpt}
          </p>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {post.tags.map(tag => (
              <span key={tag} className="tag">
                <Hash size={10} />
                {tag}
              </span>
            ))}
          </div>

          {/* Author + Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--color-bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                border: '1px solid var(--color-border-subtle)',
              }}>
                {post.author.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{post.author.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {post.author.walletAddress}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-ghost"
                onClick={() => setLiked(!liked)}
                style={{ color: liked ? '#ec4899' : undefined }}
              >
                <Heart size={16} fill={liked ? '#ec4899' : 'none'} />
                {post.likes + (liked ? 1 : 0)}
              </button>
              <span className="btn-ghost" style={{ cursor: 'default' }}>
                <Eye size={16} />
                {post.views.toLocaleString()}
              </span>
              <button className="btn-ghost" onClick={handleCopyLink}>
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? 'Copied!' : copyFailed ? 'Copy failed' : 'Share'}
              </button>
            </div>
          </div>
        </header>

        {/* Divider */}
        <div className="divider" style={{ marginBottom: 40 }} />

        {/* Content */}
        {loadedContent ? (
          <article className="markdown-body animate-fadeIn animate-delay-2" id="post-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {loadedContent}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="glass-card animate-fadeIn animate-delay-2" id="post-content" style={{ padding: 24 }}>
            <p style={{ color: '#fda4af', lineHeight: 1.6 }}>
              {contentLoading
                ? 'Loading Shelby content...'
                : 'This post metadata was found, but the Shelby content could not be loaded right now.'}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="divider" style={{ margin: '48px 0' }} />

        <div className="glass-card animate-fadeIn animate-delay-3" style={{ padding: 24 }}>
          <h3 style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div className="status-dot" />
            {isShelbyPost ? 'Shelby Storage' : 'Publishing Status'}
          </h3>

          {isShelbyPost ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Transaction Hash</span>
                <span style={metadataValueStyle}>
                  {post.txHash ? `${post.txHash.slice(0, 18)}...${post.txHash.slice(-8)}` : 'Unavailable'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Storage Reference</span>
                <span style={{ ...metadataValueStyle, color: '#a78bfa', lineHeight: 1.6 }}>
                  {post.storageRef ?? 'Unavailable'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Storage Provider</span>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>Shelby</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Network</span>
                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>{post.storageNetwork ?? 'shelbynet'}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Status</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {post.storageProvider === 'vercel-blob'
                    ? 'Metadata Cache'
                    : post.storageProvider === 'memory'
                      ? 'Memory Fallback'
                      : 'Legacy Post'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Author Wallet</span>
                <span style={metadataValueStyle}>
                  {post.author.walletAddress}
                </span>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 8,
            border: '1px solid var(--color-border-subtle)',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Published</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {dateFormatted} ({timeAgo})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
