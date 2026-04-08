import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/blog'

const BASE_URL = 'https://imvestr.de'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) return {}

  const ogImage = post.image ? `${BASE_URL}${post.image}` : `${BASE_URL}/og-image.png`

  return {
    title: `${post.title} | Imvestr Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      locale: 'de_DE',
      url: `${BASE_URL}/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      siteName: 'Imvestr',
      publishedTime: post.date,
      authors: [post.author],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  const ogImage = post.image ? `${BASE_URL}${post.image}` : `${BASE_URL}/og-image.png`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: ogImage,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Imvestr',
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <nav className="text-sm text-gray-500 mb-8">
          <Link href="/blog" className="hover:text-blue-600">Blog</Link>
          <span className="mx-2">→</span>
          <span>{post.title}</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          {post.description && (
            <p className="text-xl text-gray-600 mb-4">{post.description}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{post.author}</span>
            <span>·</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.tags && post.tags.length > 0 && (
              <>
                <span>·</span>
                <span>{post.tags.join(', ')}</span>
              </>
            )}
          </div>
        </header>

        <article className="prose prose-lg prose-gray max-w-none">
          <MDXRemote source={post.content} />
        </article>

        <footer className="mt-16 pt-8 border-t border-gray-200">
          <Link
            href="/blog"
            className="text-blue-600 font-medium hover:underline"
          >
            ← Zurück zum Blog
          </Link>
        </footer>
      </main>
    </>
  )
}
