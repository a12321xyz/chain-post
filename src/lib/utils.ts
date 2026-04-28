import { Post, Tag } from './types';

export function formatWalletAddress(address: string, start = 6, end = 4) {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function getGraphemes(input: string) {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(input)].map((part) => part.segment);
  }

  return Array.from(input);
}

export function countGraphemes(input: string) {
  return getGraphemes(input).length;
}

export function takeGraphemes(input: string, maxLength: number) {
  return getGraphemes(input).slice(0, maxLength).join('');
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'untitled-post';
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createExcerpt(markdown: string, maxLength = 180) {
  const plain = stripMarkdown(markdown);
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}...`;
}

export function calculateReadTime(markdown: string) {
  const plain = stripMarkdown(markdown);
  const words = plain ? plain.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function normalizeTags(tags: string[]) {
  return [...new Set(
    tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5)
  )];
}

export function getTopTags(posts: Post[]) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)) as Tag[];
}

export function getAverageReadTime(posts: Post[]) {
  if (posts.length === 0) return 0;
  const total = posts.reduce((sum, post) => sum + post.readTime, 0);
  return Math.round(total / posts.length);
}
