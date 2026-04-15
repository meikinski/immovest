import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
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

  const articleJsonLd = {
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

  const faqJsonLd =
    post.faq && post.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
      : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <main className="bg-white">
        <div className="max-w-3xl mx-auto px-6 py-16">

          {/* Top Logo */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xl font-extrabold tracking-tighter text-[#001d3d] hover:text-[#ff6b00] transition-colors"
            >
              imvestr
            </Link>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-10">
            <Link
              href="/blog"
              className="font-medium text-[#001d3d] hover:text-[#ff6b00] transition-colors"
            >
              Blog
            </Link>
            <span className="text-gray-300">›</span>
            <span className="text-gray-500 truncate max-w-xs">{post.title}</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <h1 className="text-4xl font-extrabold tracking-tighter text-[#001d3d] mb-4 leading-tight">
              {post.title}
            </h1>
            {post.description && (
              <p className="text-xl text-gray-500 mb-6 leading-relaxed">
                {post.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-500 font-medium">{post.author}</span>
              <span className="text-gray-300">·</span>
              <time
                dateTime={post.date}
                className="text-[#ff6b00] font-semibold"
              >
                {new Date(post.date).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {post.tags && post.tags.length > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">{post.tags.join(', ')}</span>
                </>
              )}
            </div>
          </header>

          {/* Article Body */}
          <article
            className="
              prose prose-lg max-w-none
              prose-headings:text-[#001d3d] prose-headings:font-extrabold prose-headings:tracking-tight
              prose-p:text-[#1d1d1f] prose-p:leading-relaxed
              prose-a:text-[#ff6b00] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[#001d3d]
              prose-ul:text-[#1d1d1f]
              prose-ol:text-[#1d1d1f]
              prose-blockquote:border-l-[#ff6b00] prose-blockquote:text-gray-600
              prose-code:text-[#001d3d] prose-code:bg-gray-50 prose-code:rounded prose-code:px-1
              prose-table:w-full
            "
          >
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                },
                components: {
                  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
                    <div className="overflow-x-auto my-6">
                      <table {...props} />
                    </div>
                  ),
                },
              }}
            />
          </article>

          {/* CTA Block */}
          <div className="mt-16 rounded-2xl bg-[#001d3d] px-8 py-10 text-center shadow-lg">
            <h2 className="text-2xl font-extrabold tracking-tight text-white mb-3">
              Bereit, dein erstes Investment zu analysieren?
            </h2>
            <p className="text-gray-300 mb-7 text-sm leading-relaxed max-w-md mx-auto">
              Imvestr berechnet Rendite, Cashflow und Risiko — in Sekunden. Einfach
              Exposé-Link eingeben und loslegen.
            </p>
            <Link
              href="https://imvestr.de/input-method"
              className="inline-flex items-center gap-2 rounded-full bg-[#ff6b00] text-white px-7 py-3 text-sm font-bold hover:bg-[#e05e00] transition-colors shadow-md"
            >
              Immobilie jetzt analysieren →
            </Link>
          </div>

          {/* Back to Blog */}
          <footer className="mt-10 flex justify-start">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-[#001d3d] text-[#001d3d] px-6 py-2.5 text-sm font-semibold hover:bg-[#001d3d] hover:text-white transition-colors"
            >
              ← Zurück zum Blog
            </Link>
          </footer>
        </div>
      </main>
    </>
  )
}
