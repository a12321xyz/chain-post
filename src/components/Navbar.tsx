'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, PenLine, Blocks } from 'lucide-react';
import WalletButton from './WalletButton';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="nav" id="navbar">
      <div className="container-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
            }}>
              <Blocks size={20} color="white" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span className="gradient-text">Chain</span>
              <span style={{ color: 'var(--color-text-primary)' }}>Post</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/" className="btn-ghost" style={{ textDecoration: 'none' }}>
              Explore
            </Link>
            <Link href="/write" className="btn-ghost" style={{ textDecoration: 'none' }}>
              Write
            </Link>
            <Link href="/profile" className="btn-ghost" style={{ textDecoration: 'none' }}>
              Profile
            </Link>
            <Link href="/about" className="btn-ghost" style={{ textDecoration: 'none' }}>
              About
            </Link>
            <div style={{ width: 1, height: 24, background: 'var(--color-border-subtle)', margin: '0 4px' }} />
            <WalletButton />
          </div>

          {/* Mobile Toggle */}
          <button
            className="btn-ghost mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none' }}
            aria-label="Toggle menu"
            id="mobile-menu-toggle"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="mobile-menu animate-fadeIn" style={{
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <Link href="/" className="btn-ghost" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}
              onClick={() => setMobileOpen(false)}>
              Explore
            </Link>
            <Link href="/write" className="btn-ghost" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}
              onClick={() => setMobileOpen(false)}>
              Write
            </Link>
            <Link href="/profile" className="btn-ghost" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}
              onClick={() => setMobileOpen(false)}>
              Profile
            </Link>
            <Link href="/about" className="btn-ghost" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}
              onClick={() => setMobileOpen(false)}>
              About
            </Link>
            <Link href="/write" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', marginTop: 8 }}
              onClick={() => setMobileOpen(false)}>
              <PenLine size={16} />
              <span>Publish</span>
            </Link>
          </div>
        )}
      </div>

        <style jsx>{`
          @media (max-width: 768px) {
            .desktop-nav {
              display: none !important;
            }
          .mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}
