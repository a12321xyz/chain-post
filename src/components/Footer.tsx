import { Blocks, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      marginTop: 80,
      borderTop: '1px solid var(--color-border-subtle)',
      padding: '48px 0 32px',
      background: 'rgba(10, 10, 15, 0.9)',
    }}>
      <div className="container-page">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 40,
          marginBottom: 40,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Blocks size={18} color="white" />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                <span className="gradient-text">Chain</span>Post
              </span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Wallet-connected publishing for Aptos builders. Deploy on Vercel, persist with Neon, and extend toward on-chain flows.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Platform
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>
                Explore Posts
              </Link>
              <Link href="/write" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                Write a Post
              </Link>
              <Link href="/profile" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                Creator Profile
              </Link>
              <Link href="/about" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                About ChainPost
              </Link>
            </div>
          </div>

          {/* Ecosystem */}
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Ecosystem
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://aptos.dev" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                Aptos Docs <ExternalLink size={12} />
              </a>
              <a href="https://neon.tech" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                Neon Postgres <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Status */}
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Network Status
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="status-dot" />
              <span style={{ color: '#34d399', fontSize: '0.875rem', fontWeight: 500 }}>Ready for Vercel</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              Set `DATABASE_URL` to enable persistent shared publishing.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="divider" style={{ marginBottom: 24 }} />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} ChainPost. Built as an Aptos wallet publishing MVP.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
              Aptos Wallets
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
              Neon + Vercel
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
