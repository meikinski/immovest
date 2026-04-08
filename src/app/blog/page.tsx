import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog – Immobilien-Wissen & Investment-Tipps | Imvestr',
  description:
    'Fundiertes Wissen rund um Immobilien-Investment: Rendite, Cashflow, Finanzierung und mehr. Alles was du brauchst, um kluge Entscheidungen zu treffen.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://imvestr.de/blog',
    title: 'Blog – Immobilien-Wissen & Investment-Tipps | Imvestr',
    description:
      'Fundiertes Wissen rund um Immobilien-Investment: Rendite, Cashflow, Finanzierung und mehr.',
    siteName: 'Imvestr',
  },
}

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">Immobilien-Blog</h1>
      <p className="text-lg text-gray-600 mb-12">
        Fundiertes Wissen für smarte Immobilien-Investoren.
      </p>

      {posts.length === 0 ? (
        <p className="text-gray-500">Noch keine Artikel vorhanden.</p>
      ) : (
        <div className="grid gap-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                  {post.title}
                </Link>
              </h2>
              {post.description && (
                <p className="text-gray-600 mb-4">{post.description}</p>
              )}
              <Link
                href={`/blog/${post.slug}`}
                className="text-blue-600 font-medium hover:underline text-sm"
              >
                Weiterlesen →
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
