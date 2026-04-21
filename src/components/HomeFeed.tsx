'use client';

import { useMemo, useState } from 'react';
import { Post, Tag } from '@/lib/types';
import PostCard from '@/components/PostCard';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import Sidebar from '@/components/Sidebar';
import { StorageMode } from '@/lib/store';

interface HomeFeedProps {
  posts: Post[];
  categories: string[];
  topTags: Tag[];
  sidebarStats: Array<{ label: string; value: string; icon: string }>;
  storageMode: StorageMode;
}

export default function HomeFeed({ posts, categories, topTags, sidebarStats, storageMode }: HomeFeedProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesSearch = !query || [
        post.title,
        post.excerpt,
        post.category,
        post.author.name,
        ...post.tags,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, posts, search]);

  const handleTagClick = (tag: string) => {
    setSearch(tag);
    setActiveCategory('All');
  };

  return (
    <section style={{ padding: '48px 0' }} id="posts-section">
      <div className="container-page">
        <div className="content-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 40,
          alignItems: 'start',
        }}>
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginBottom: 32,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                  Latest Posts
                </h2>
                <SearchBar value={search} onChange={setSearch} />
              </div>

              <CategoryFilter
                categories={categories}
                active={activeCategory}
                onChange={setActiveCategory}
              />
            </div>

            {filteredPosts.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
                gap: 24,
              }}>
                {filteredPosts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '80px 0',
                color: 'var(--color-text-muted)',
              }}>
                <p style={{ fontSize: '1.2rem', marginBottom: 8 }}>No posts found</p>
                <p style={{ fontSize: '0.9rem' }}>Try a different search or category</p>
              </div>
            )}
          </div>

          <div className="sidebar-container">
            <Sidebar topTags={topTags} stats={sidebarStats} storageMode={storageMode} onTagClick={handleTagClick} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 960px) {
          .sidebar-container {
            display: none;
          }
          .content-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
