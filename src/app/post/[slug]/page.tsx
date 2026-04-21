import PostDetail from './PostDetail';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { connection } from 'next/server';
import { getPostBySlug } from '@/lib/store';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} — ChainPost`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <PostDetail post={post} />;
}
