import { Post, Tag } from './types';

export const mockPosts: Post[] = [
  {
    id: "demo-post-1",
    title: "Welcome to ChainPost",
    excerpt: "Learn how ChainPost combines wallet profiles, markdown, and Shelby-backed publishing.",
    content: "# Welcome to ChainPost\n\nThis is a sample post demonstrating markdown capabilities.\n\n- Write in Markdown\n- Preview instantly\n- Store markdown on Shelby when configured\n- Cache feed metadata for discovery",
    author: {
      walletAddress: "0x1234...abcd",
      name: "ChainPost Team",
      bio: "The creators of ChainPost",
      avatar: "CP",
    },
    tags: ["Tutorial", "Web3"],
    category: "Tutorial",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    readTime: 2,
    likes: 42,
    views: 1337,
    storageProvider: "memory",
    isOnChain: false,
    slug: "welcome-to-chainpost",
  },
  {
    id: "demo-post-2",
    title: "How Shelby Storage Fits ChainPost",
    excerpt: "Markdown content can live on Shelby while the app keeps a lightweight feed index.",
    content: "Shelby stores the post body. ChainPost keeps title, excerpt, tags, author, and ordering metadata in a small app cache so readers can discover posts quickly.",
    author: {
      walletAddress: "0x5678...efgh",
      name: "Alice Builder",
      bio: "Web3 enthusiast and developer",
      avatar: "AB",
    },
    tags: ["Architecture", "Innovation"],
    category: "Technical",
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    readTime: 3,
    likes: 15,
    views: 200,
    storageProvider: "memory",
    isOnChain: false,
    slug: "how-shelby-storage-fits-chainpost",
  },
  {
    id: "demo-post-3",
    title: "Building on Aptos",
    excerpt: "How the Aptos wallet adapter makes onboarding seamless.",
    content: "Using the `@aptos-labs/wallet-adapter-react` allows us to securely authenticate users via cryptographic signatures.",
    author: {
      walletAddress: "0x9abc...ijkl",
      name: "Bob Dev",
      bio: "Smart contract auditor",
      avatar: "BD",
    },
    tags: ["Aptos", "Web3", "Tutorial"],
    category: "Technical",
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    readTime: 4,
    likes: 89,
    views: 500,
    storageProvider: "memory",
    isOnChain: false,
    slug: "building-on-aptos",
  }
];

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
