'use client';

import Link from 'next/link';
import type { StorageMode } from '@/lib/store';
import { Tag } from '@/lib/types';
import { Hash, TrendingUp } from 'lucide-react';

interface SidebarProps {
  topTags: Tag[];
  stats: Array<{ label: string; value: string; icon: string }>;
  storageMode: StorageMode;
  onTagClick?: (tag: string) => void;
}

export default function Sidebar({ topTags, stats, storageMode, onTagClick }: SidebarProps) {
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Network Stats */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <TrendingUp size={14} />
          Network Stats
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              padding: 12,
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 10,
              border: '1px solid var(--color-border-subtle)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Tags */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Hash size={14} />
          Trending Tags
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {topTags.map((tag) => (
            <button
              key={tag.name}
              className="tag"
              onClick={() => onTagClick?.(tag.name)}
              style={{
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 12px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Hash size={11} />
                {tag.name}
              </span>
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                {tag.count} posts
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* App Status */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div className="status-dot" />
          <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
            {storageMode === 'memory' ? 'Memory Metadata Cache' : 'Blob Metadata Cache'}
          </span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 12 }}>
          {storageMode === 'memory'
            ? 'Feed metadata and fallback posts are ephemeral. Shelby posts keep markdown content outside this cache.'
            : 'Feed metadata is cached in Vercel Blob. Shelby posts store markdown content on Shelby.'}
        </p>
        <Link
          href="/about"
          className="btn-secondary"
          style={{
            textDecoration: 'none',
            width: '100%',
            justifyContent: 'center',
            fontSize: '0.85rem',
            padding: '10px 16px',
          }}
        >
          View Product Notes →
        </Link>
      </div>
    </aside>
  );
}
