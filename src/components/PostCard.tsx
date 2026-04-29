'use client';

import Link from 'next/link';
import { Post } from '@/lib/types';
import { Clock, Heart, Eye, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatWalletAddress } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  index: number;
}

export default function PostCard({ post, index }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true });
  const isShelbyStored = post.storageProvider === 'shelby' && post.txHash && post.storageRef;
  const shelbyTxHash = isShelbyStored ? post.txHash : undefined;

  const categoryColors: Record<string, string> = {
    'Tutorial': 'badge-cyan',
    'Opinion': 'badge-pink',
    'Technical': 'badge-purple',
    'Case Study': 'badge-green',
    'Innovation': 'badge-purple',
  };

  return (
    <Link href={`/post/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article
        className={`glass-card animate-fadeIn animate-delay-${Math.min(index + 1, 5)}`}
        id={`post-card-${post.id}`}
        style={{
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          height: '100%',
          cursor: 'pointer',
        }}
      >
        {/* Top row: category + time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className={`badge ${categoryColors[post.category] || 'badge-purple'}`}>
            {post.category}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Clock size={12} />
            {timeAgo}
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
          flex: 1,
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}>
          {post.title}
        </h2>

        {/* Excerpt */}
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}>
          {post.excerpt}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              <Hash size={10} />
              {tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="tag">+{post.tags.length - 3}</span>
          )}
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Footer: author + stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: '1.5rem' }}>{post.author.avatar}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.author.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {formatWalletAddress(post.author.walletAddress)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Heart size={13} />
              {post.likes}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Eye size={13} />
              {post.views.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Shelby storage indicator */}
        {shelbyTxHash && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: 'rgba(16, 185, 129, 0.06)',
            borderRadius: 8,
            border: '1px solid rgba(16, 185, 129, 0.12)',
          }}>
            <div className="status-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
              Shelby stored
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
              {shelbyTxHash.slice(0, 10)}...{shelbyTxHash.slice(-6)}
            </span>
          </div>
        )}
      </article>
    </Link>
  );
}
