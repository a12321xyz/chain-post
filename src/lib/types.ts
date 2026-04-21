export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: Author;
  tags: string[];
  category: string;
  coverImage?: string;
  publishedAt: string;
  readTime: number;
  likes: number;
  views: number;
  txHash?: string;
  storageRef?: string;
  isOnChain: boolean;
}

export interface Author {
  name: string;
  avatar: string;
  walletAddress: string;
  bio: string;
}

export interface Tag {
  name: string;
  count: number;
}

export interface ProfileInput {
  walletAddress: string;
  name: string;
  bio: string;
  avatar: string;
}

export interface CreatePostInput {
  walletAddress: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isOnChain?: boolean;
}

export type SortOption = 'latest' | 'popular' | 'trending';
export type ViewMode = 'grid' | 'list';
