import { Sparkles, ArrowRight, Blocks } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import HomeFeed from '@/components/HomeFeed';
import { categories } from '@/lib/mock-data';
import { getPosts, getStorageMode } from '@/lib/store';
import { getAverageReadTime, getTopTags } from '@/lib/utils';

export default async function Home() {
  await connection();

  const posts = await getPosts();
  const storageMode = getStorageMode();
  const topTags = getTopTags(posts).slice(0, 8);
  const authorCount = new Set(posts.map((post) => post.author.walletAddress)).size;
  const averageReadTime = getAverageReadTime(posts);
  const tagCount = new Set(posts.flatMap((post) => post.tags)).size;

  const heroStats = [
    { label: 'Posts Published', value: posts.length.toString() },
    { label: 'Wallet Authors', value: authorCount.toString() },
    { label: 'Categories', value: String(categories.length - 1) },
    { label: 'Avg Read Time', value: `${averageReadTime || 1} min` },
  ];

  const sidebarStats = [
    { label: 'Total Posts', value: posts.length.toString(), icon: '📝' },
    { label: 'Authors', value: authorCount.toString(), icon: '✍️' },
    { label: 'Tags', value: tagCount.toString(), icon: '🏷️' },
    { label: 'Storage', value: 'Shelby', icon: '🌐' },
  ];

  return (
    <>
      <section style={{ padding: '72px 0 48px', textAlign: 'center' }} id="hero">
        <div className="container-narrow">
          <div className="animate-fadeIn" style={{ marginBottom: 16 }}>
            <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
              <Sparkles size={12} style={{ marginRight: 4 }} />
              Aptos Wallet Ready
            </span>
          </div>

          <h1 className="animate-fadeIn animate-delay-1" style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: 20,
          }}>
            Publish with Your{' '}
            <span className="gradient-text">Wallet</span>
            <br />
            Own Your{' '}
            <span className="gradient-text-pink">Creator Identity</span>
          </h1>

          <p className="animate-fadeIn animate-delay-2" style={{
            fontSize: '1.15rem',
            color: 'var(--color-text-secondary)',
            maxWidth: 620,
            margin: '0 auto 32px',
            lineHeight: 1.7,
          }}>
            ChainPost is a wallet-connected publishing app for Aptos builders. Create a profile,
            write in markdown, store post bodies on Shelby, and cache feed metadata for discovery.
          </p>

          <div className="animate-fadeIn animate-delay-3" style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link href="/write" className="btn-primary" style={{ textDecoration: 'none' }}>
              <span>Start Writing</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/about" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <Blocks size={18} />
              <span>How It Works</span>
            </Link>
          </div>

          <div className="animate-fadeIn animate-delay-4" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            marginTop: 48,
            flexWrap: 'wrap',
          }}>
            {heroStats.map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }} className="gradient-text">
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page">
        <div className="divider" />
      </div>

      <HomeFeed
        posts={posts}
        categories={categories}
        topTags={topTags}
        sidebarStats={sidebarStats}
        storageMode={storageMode}
      />
    </>
  );
}
