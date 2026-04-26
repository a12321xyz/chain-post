import { Metadata } from 'next';
import { Database, Shield, Zap, ArrowRight, Globe, Lock, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — ChainPost',
  description: 'Learn how ChainPost stores markdown on Shelby and caches feed metadata for discovery.',
};

export default function AboutPage() {
  const steps = [
    {
      icon: '✍️',
      title: 'Connect',
      description: 'Attach an Aptos wallet using the wallet adapter in the navbar.',
      detail: 'Works with compatible AIP-62 wallets detected in the browser.',
    },
    {
      icon: '👤',
      title: 'Profile',
      description: 'Create a public creator profile tied to your connected wallet address.',
      detail: 'Add your display name, bio, and avatar once before publishing.',
    },
    {
      icon: '📝',
      title: 'Write',
      description: 'Compose posts in markdown with categories, tags, and live preview.',
      detail: 'The editor is optimized for quick publishing, not just a static demo.',
    },
    {
      icon: '🚀',
      title: 'Publish',
      description: 'Register and upload post markdown to Shelby from the connected wallet.',
      detail: 'The app keeps title, tags, excerpt, and ordering metadata in a lightweight cache.',
    },
  ];

  const features = [
    {
      icon: <Shield size={24} />,
      title: 'Wallet Connected',
      description: 'Creator identity starts with an Aptos wallet instead of email-only signups.',
      color: '#8b5cf6',
    },
    {
      icon: <Zap size={24} />,
      title: 'Shelby Storage',
      description: 'Markdown content is uploaded to Shelby after the wallet signs the blob registration transaction.',
      color: '#06b6d4',
    },
    {
      icon: <Lock size={24} />,
      title: 'Indexed Discovery',
      description: 'Feed metadata is cached separately so the homepage can list posts without embedding every body.',
      color: '#ec4899',
    },
    {
      icon: <Globe size={24} />,
      title: 'Markdown Native',
      description: 'Write with preview, categories, tags, and readable post detail pages out of the box.',
      color: '#10b981',
    },
    {
      icon: <Database size={24} />,
      title: 'Creator Profiles',
      description: 'Each wallet can maintain a profile and see its own published posts on a dedicated page.',
      color: '#f59e0b',
    },
    {
      icon: <BookOpen size={24} />,
      title: 'Aptos Anchored',
      description: 'Shelby posts display the real registration transaction hash returned by the connected wallet.',
      color: '#6366f1',
    },
  ];

  return (
    <div style={{ padding: '48px 0' }}>
      {/* Hero */}
      <section className="container-narrow" style={{ textAlign: 'center', marginBottom: 80 }}>
        <div className="animate-fadeIn" style={{ marginBottom: 16 }}>
          <span className="badge badge-cyan">About ChainPost</span>
        </div>
        <h1 className="animate-fadeIn animate-delay-1" style={{
          fontSize: 'clamp(2rem, 4.5vw, 3rem)',
          fontWeight: 900,
          lineHeight: 1.2,
          letterSpacing: '-0.03em',
          marginBottom: 20,
        }}>
          Publishing that{' '}
          <span className="gradient-text">You Can Ship</span>
        </h1>
        <p className="animate-fadeIn animate-delay-2" style={{
          fontSize: '1.1rem',
          color: 'var(--color-text-secondary)',
          maxWidth: 560,
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          ChainPost combines wallet-based identity, Shelby markdown storage, and a lightweight metadata cache
          into a real MVP you can deploy and extend.
        </p>
      </section>

      {/* How It Works */}
      <section className="container-page" style={{ marginBottom: 80 }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: 48,
          letterSpacing: '-0.01em',
        }}>
          How It Works
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
        }}>
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`glass-card animate-fadeIn animate-delay-${i + 1}`}
              style={{ padding: 28, textAlign: 'center', position: 'relative' }}
            >
              <div style={{
                fontSize: '2.5rem',
                marginBottom: 16,
              }}>
                {step.icon}
              </div>
              <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#a78bfa',
              }}>
                {i + 1}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
                {step.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 8, lineHeight: 1.6 }}>
                {step.description}
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container-page" style={{ marginBottom: 80 }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: 48,
          letterSpacing: '-0.01em',
        }}>
          Why <span className="gradient-text">ChainPost</span>?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`glass-card animate-fadeIn animate-delay-${Math.min(i + 1, 5)}`}
              style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${feature.color}15`,
                border: `1px solid ${feature.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: feature.color,
                flexShrink: 0,
              }}>
                {feature.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container-narrow" style={{ marginBottom: 80 }}>
        <div className="glass-card" style={{ padding: 36 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>
            Technology Stack
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
          }}>
            {[
              { name: 'Next.js', desc: 'Frontend Framework', badge: 'badge-purple' },
              { name: 'Aptos Wallet Adapter', desc: 'Wallet Connectivity', badge: 'badge-cyan' },
              { name: 'Shelby SDK', desc: 'Markdown Storage', badge: 'badge-green' },
              { name: 'Vercel Blob', desc: 'Metadata Cache', badge: 'badge-cyan' },
              { name: 'TypeScript', desc: 'Language', badge: 'badge-pink' },
            ].map(tech => (
              <div key={tech.name} style={{
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                border: '1px solid var(--color-border-subtle)',
                textAlign: 'center',
              }}>
                <span className={`badge ${tech.badge}`} style={{ marginBottom: 8, display: 'inline-block' }}>
                  {tech.name}
                </span>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: 8 }}>
                  {tech.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-narrow" style={{ textAlign: 'center' }}>
        <div className="glass-card" style={{
          padding: 48,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(6, 182, 212, 0.05))',
          border: '1px solid rgba(139, 92, 246, 0.15)',
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>
            Ready to <span className="gradient-text">Publish?</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: '1.05rem' }}>
            Start writing your first Shelby-backed post today.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/write" className="btn-primary" style={{ textDecoration: 'none' }}>
              <span>Start Writing</span>
              <ArrowRight size={18} />
            </Link>
            <a href="https://shelby.xyz" target="_blank" rel="noopener noreferrer"
              className="btn-secondary" style={{ textDecoration: 'none' }}>
              <span>Explore Shelby</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
