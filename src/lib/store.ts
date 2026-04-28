import { AccountAddress } from '@aptos-labs/ts-sdk';
import { get as getBlob, list, put, type ListBlobResultBlob } from '@vercel/blob';
import { mockPosts } from './mock-data';
import { Author, CreatePostInput, Post, ProfileInput, StorageProvider } from './types';
import { calculateReadTime, createExcerpt, formatWalletAddress, normalizeTags, slugify } from './utils';
import { fetchShelbyPostContent } from './shelby-server';

export type StorageMode = 'blob' | 'memory';

interface BlobDatabase {
  authors: Record<string, Author>;
  posts: Post[];
}

declare global {
  var __chainPostMemoryStore: BlobDatabase | undefined;
}

const blobEnabled = (process.env.BLOB_READ_WRITE_TOKEN?.trim().length ?? 0) > 0;
const LEGACY_DATABASE_KEY = 'chainpost-db.json';
const POST_PREFIX = 'chainpost/posts/';
const AUTHOR_PREFIX = 'chainpost/authors/';

function normalizeWalletKey(walletAddress: string) {
  try {
    return AccountAddress.from(walletAddress).toString().toLowerCase();
  } catch {
    return walletAddress.toLowerCase();
  }
}

function normalizeWalletStrict(walletAddress: string) {
  return AccountAddress.from(walletAddress).toString().toLowerCase();
}

function clonePost(post: Post): Post {
  return {
    ...post,
    author: { ...post.author },
    tags: [...post.tags],
  };
}

function getMemoryStore(): BlobDatabase {
  if (!globalThis.__chainPostMemoryStore) {
    globalThis.__chainPostMemoryStore = {
      authors: {},
      posts: mockPosts.map(clonePost),
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

async function fetchPublicJson<T>(url: string): Promise<T | undefined> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch (error) {
    console.error('Error fetching Blob JSON:', error);
    return undefined;
  }
}

async function streamToJson<T>(stream: ReadableStream<Uint8Array>) {
  return (await new Response(stream).json()) as T;
}

async function fetchBlobJson<T>(blob: ListBlobResultBlob): Promise<T | undefined> {
  try {
    const result = await getBlob(blob.pathname, { access: 'private', useCache: false });
    if (result?.statusCode === 200) {
      return streamToJson<T>(result.stream);
    }
  } catch (error) {
    console.error(`Error fetching private Blob JSON for ${blob.pathname}:`, error);
  }

  return fetchPublicJson<T>(blob.url);
}

async function getLegacyBlobDatabase(): Promise<BlobDatabase> {
  try {
    const { blobs } = await list({ prefix: LEGACY_DATABASE_KEY, limit: 1 });
    if (blobs.length > 0 && blobs[0]) {
      return (await fetchBlobJson<BlobDatabase>(blobs[0])) ?? { authors: {}, posts: [] };
    }
  } catch (error) {
    console.error('Error fetching legacy Blob DB:', error);
  }
  return { authors: {}, posts: [] };
}

async function listBlobJson<T>(prefix: string): Promise<T[]> {
  try {
    const records: T[] = [];
    let cursor: string | undefined;

    do {
      const result = await list({ prefix, limit: 1000, cursor });
      const pageRecords = await Promise.all(result.blobs.map((blob) => fetchBlobJson<T>(blob)));
      records.push(...(pageRecords.filter((record) => record !== undefined) as T[]));
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);

    return records;
  } catch (error) {
    console.error(`Error listing Blob JSON under ${prefix}:`, error);
    return [];
  }
}

async function getBlobPosts(): Promise<Post[]> {
  const [legacyDb, postFiles] = await Promise.all([
    getLegacyBlobDatabase(),
    listBlobJson<Post>(POST_PREFIX),
  ]);
  const postsBySlug = new Map<string, Post>();

  for (const post of legacyDb.posts) {
    postsBySlug.set(post.slug, clonePost(post));
  }

  for (const post of postFiles) {
    postsBySlug.set(post.slug, clonePost(post));
  }

  return [...postsBySlug.values()];
}

async function getBlobAuthors(): Promise<Record<string, Author>> {
  const [legacyDb, authorFiles] = await Promise.all([
    getLegacyBlobDatabase(),
    listBlobJson<Author>(AUTHOR_PREFIX),
  ]);
  const authors: Record<string, Author> = { ...legacyDb.authors };

  for (const author of authorFiles) {
    authors[normalizeWalletKey(author.walletAddress)] = author;
  }

  return authors;
}

async function saveBlobPost(post: Post, allowOverwrite = true) {
  await put(`${POST_PREFIX}${post.slug}.json`, JSON.stringify(post), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite,
  });
}

async function saveBlobAuthor(author: Author) {
  await put(`${AUTHOR_PREFIX}${normalizeWalletKey(author.walletAddress)}.json`, JSON.stringify(author), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function getActiveDatabase(): Promise<BlobDatabase> {
  if (!blobEnabled) {
    return getMemoryStore();
  }

  const [authors, posts] = await Promise.all([
    getBlobAuthors(),
    getBlobPosts(),
  ]);

  return { authors, posts };
}

async function hydratePostContent(post: Post): Promise<Post> {
  if (post.content || post.storageProvider !== 'shelby') {
    return post;
  }

  try {
    const content = await fetchShelbyPostContent(post);
    return content ? { ...post, content } : post;
  } catch (error) {
    console.error(`Error fetching Shelby content for ${post.slug}:`, error);
    return post;
  }
}

function assertShelbyPostInput(input: CreatePostInput) {
  if (input.storageProvider !== 'shelby') return;

  if (!input.storageRef || !input.storageAccount || !input.storageBlobName || !input.storageNetwork || !input.txHash) {
    throw new Error('SHELBY_METADATA_REQUIRED');
  }

  if (normalizeWalletStrict(input.storageAccount) !== normalizeWalletStrict(input.walletAddress)) {
    throw new Error('SHELBY_ACCOUNT_MISMATCH');
  }
}

function buildPost(input: CreatePostInput, author: Author, id: string, slug: string): Post {
  const title = input.title.trim();
  const content = input.content.trim();
  const isShelbyPost = input.storageProvider === 'shelby';
  const storageProvider: StorageProvider = isShelbyPost
    ? 'shelby'
    : blobEnabled
      ? 'vercel-blob'
      : 'memory';

  return {
    id,
    title,
    excerpt: createExcerpt(content),
    content: isShelbyPost ? undefined : content,
    author,
    tags: normalizeTags(input.tags),
    category: input.category,
    publishedAt: new Date().toISOString(),
    readTime: calculateReadTime(content),
    likes: 0,
    views: 0,
    isOnChain: isShelbyPost,
    txHash: isShelbyPost ? input.txHash : undefined,
    storageProvider,
    storageRef: isShelbyPost ? input.storageRef : undefined,
    storageAccount: isShelbyPost ? input.storageAccount : undefined,
    storageBlobName: isShelbyPost ? input.storageBlobName : undefined,
    storageNetwork: isShelbyPost ? input.storageNetwork : undefined,
    slug,
  };
}

function createUniqueSlug(baseSlug: string, existingSlugs: Set<string>) {
  let attempt = 0;
  let slug = baseSlug;

  while (existingSlugs.has(slug)) {
    attempt++;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  return slug;
}

export async function getPosts(): Promise<Post[]> {
  const db = await getActiveDatabase();
  return [...db.posts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const db = await getActiveDatabase();
  const post = db.posts.find((p) => p.slug === slug);
  return post ? hydratePostContent(post) : undefined;
}

export async function getPostsByWallet(walletAddress: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((p) => normalizeWalletKey(p.author.walletAddress) === normalizeWalletKey(walletAddress));
}

export async function getAuthorByWallet(walletAddress: string): Promise<Author | undefined> {
  const db = await getActiveDatabase();
  return db.authors[normalizeWalletKey(walletAddress)];
}

export async function upsertAuthorProfile(input: ProfileInput): Promise<Author> {
  const walletAddress = normalizeWalletKey(input.walletAddress);
  const author: Author = {
    walletAddress: AccountAddress.from(input.walletAddress).toString(),
    name: input.name.trim() || `Writer ${formatWalletAddress(input.walletAddress, 6, 3)}`,
    bio: input.bio.trim(),
    avatar: input.avatar.trim() || 'CP',
  };

  if (!blobEnabled) {
    const db = getMemoryStore();
    db.authors[walletAddress] = author;
    db.posts = db.posts.map((post) =>
      normalizeWalletKey(post.author.walletAddress) === walletAddress ? { ...post, author } : post
    );
    return author;
  }

  await saveBlobAuthor(author);

  const posts = await getBlobPosts();
  const authoredPosts = posts.filter((post) => normalizeWalletKey(post.author.walletAddress) === walletAddress);
  await Promise.all(authoredPosts.map((post) => saveBlobPost({ ...post, author })));

  return author;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  assertShelbyPostInput(input);

  const author = await getAuthorByWallet(input.walletAddress);
  if (!author) {
    throw new Error('PROFILE_REQUIRED');
  }

  const baseSlug = slugify(input.title.trim());

  if (!blobEnabled) {
    const db = getMemoryStore();
    const slug = createUniqueSlug(baseSlug, new Set(db.posts.map((post) => post.slug)));
    const post = buildPost(input, author, crypto.randomUUID(), slug);
    db.posts.push(post);
    return post;
  }

  const id = crypto.randomUUID();
  const existingSlugs = new Set((await getBlobPosts()).map((post) => post.slug));
  const baseCandidate = createUniqueSlug(baseSlug, existingSlugs);
  const candidateSlugs = [baseCandidate, `${baseSlug}-${id.slice(0, 8)}`];

  for (const slug of candidateSlugs) {
    const post = buildPost(input, author, id, slug);

    try {
      await saveBlobPost(post, false);
      return post;
    } catch (error) {
      console.error(`Error saving post blob for ${slug}:`, error);
    }
  }

  throw new Error('SLUG_CONFLICT');
}
