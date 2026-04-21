import { list, put } from '@vercel/blob';
import { mockPosts } from './mock-data';
import { Author, CreatePostInput, Post, ProfileInput } from './types';
import { calculateReadTime, createExcerpt, formatWalletAddress, normalizeTags, slugify } from './utils';

export type StorageMode = 'blob' | 'memory';

interface BlobDatabase {
  authors: Record<string, Author>;
  posts: Post[];
}

declare global {
  var __chainPostMemoryStore: BlobDatabase | undefined;
}

const blobEnabled = process.env.BLOB_READ_WRITE_TOKEN !== undefined;

function getMemoryStore(): BlobDatabase {
  if (!globalThis.__chainPostMemoryStore) {
    globalThis.__chainPostMemoryStore = {
      authors: {},
      posts: mockPosts.map((post) => ({ ...post, tags: [...post.tags] })),
    };
  }
  return globalThis.__chainPostMemoryStore;
}

export function getStorageMode(): StorageMode {
  return blobEnabled ? 'blob' : 'memory';
}

export function isPersistentStorageEnabled() {
  return blobEnabled;
}

async function getBlobDatabase(): Promise<BlobDatabase> {
  try {
    const { blobs } = await list({ prefix: 'chainpost-db.json', limit: 1 });
    if (blobs.length > 0 && blobs[0]) {
      const res = await fetch(blobs[0].url, { cache: 'no-store' });
      if (res.ok) {
        return (await res.json()) as BlobDatabase;
      }
    }
  } catch (error) {
    console.error('Error fetching Blob DB:', error);
  }
  return { authors: {}, posts: [] };
}

async function saveBlobDatabase(db: BlobDatabase) {
  try {
    await put('chainpost-db.json', JSON.stringify(db), {
      access: 'public',
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error('Error saving Blob DB:', error);
    throw error;
  }
}

async function getActiveDatabase(): Promise<BlobDatabase> {
  if (!blobEnabled) {
    return getMemoryStore();
  }
  return getBlobDatabase();
}

async function updateActiveDatabase(updater: (db: BlobDatabase) => void) {
  if (!blobEnabled) {
    updater(getMemoryStore());
    return;
  }
  const db = await getBlobDatabase();
  updater(db);
  await saveBlobDatabase(db);
}

export async function getPosts(): Promise<Post[]> {
  const db = await getActiveDatabase();
  return [...db.posts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const db = await getActiveDatabase();
  return db.posts.find((p) => p.slug === slug);
}

export async function getPostsByWallet(walletAddress: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((p) => p.author.walletAddress.toLowerCase() === walletAddress.toLowerCase());
}

export async function getAuthorByWallet(walletAddress: string): Promise<Author | undefined> {
  const db = await getActiveDatabase();
  return db.authors[walletAddress.toLowerCase()];
}

export async function upsertAuthorProfile(input: ProfileInput): Promise<Author> {
  const walletAddress = input.walletAddress.toLowerCase();
  const author: Author = {
    walletAddress: input.walletAddress,
    name: input.name.trim() || `Writer ${formatWalletAddress(input.walletAddress, 6, 3)}`,
    bio: input.bio.trim(),
    avatar: input.avatar.trim() || '🧑‍💻',
  };

  await updateActiveDatabase((db) => {
    db.authors[walletAddress] = author;
    // Update existing posts to reflect new profile metadata
    db.posts = db.posts.map((post) =>
      post.author.walletAddress.toLowerCase() === walletAddress ? { ...post, author } : post
    );
  });

  return author;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const author = await getAuthorByWallet(input.walletAddress);
  if (!author) {
    throw new Error('PROFILE_REQUIRED');
  }

  const title = input.title.trim();
  const content = input.content.trim();
  const tags = normalizeTags(input.tags);
  const baseSlug = slugify(title);

  let post: Post | null = null;

  await updateActiveDatabase((db) => {
    let attempt = 0;
    let slug = baseSlug;
    while (db.posts.some((p) => p.slug === slug)) {
      attempt++;
      slug = `${baseSlug}-${attempt + 1}`;
    }

    post = {
      id: crypto.randomUUID(),
      title,
      excerpt: createExcerpt(content),
      content,
      author,
      tags,
      category: input.category,
      publishedAt: new Date().toISOString(),
      readTime: calculateReadTime(content),
      likes: 0,
      views: 0,
      isOnChain: !!input.isOnChain,
      txHash: input.isOnChain
        ? '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        : undefined,
      slug,
    };

    db.posts.push(post);
  });

  if (!post) {
    throw new Error('Could not create post');
  }

  return post;
}
