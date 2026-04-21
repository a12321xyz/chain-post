import { Post, Tag } from './types';

export const mockPosts: Post[] = [];

export const mockTags: Tag[] = [
  { name: 'Web3', count: 24 },
  { name: 'Shelby', count: 18 },
  { name: 'AI', count: 15 },
  { name: 'Tutorial', count: 12 },
  { name: 'DeFi', count: 10 },
  { name: 'Gaming', count: 9 },
  { name: 'NFT', count: 8 },
  { name: 'Aptos', count: 7 },
  { name: 'Opinion', count: 6 },
  { name: 'Architecture', count: 5 },
  { name: 'Publishing', count: 4 },
  { name: 'Innovation', count: 4 },
];

export const categories = [
  'All',
  'Tutorial',
  'Opinion',
  'Technical',
  'Case Study',
  'Innovation',
];

export function getPostBySlug(slug: string): Post | undefined {
  return mockPosts.find(p => p.slug === slug);
}

export function getPostsByTag(tag: string): Post[] {
  return mockPosts.filter(p => p.tags.includes(tag));
}

export function getPostsByCategory(category: string): Post[] {
  if (category === 'All') return mockPosts;
  return mockPosts.filter(p => p.category === category);
}

export function searchPosts(query: string): Post[] {
  const q = query.toLowerCase();
  return mockPosts.filter(
    p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
  );
}
