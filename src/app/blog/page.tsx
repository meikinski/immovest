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
    <main className="bg-white">
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xl font-extrabold tracking-tighter text-[#001d3d] hover:text-[#ff6b00] transition-colors"
        >
          imvestr
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-16 text-center">
        <p className="text-sm font-semibold tracking-widest text-[#ff6b00] uppercase mb-4">
          Imvestr Blog
        </p>
        <h1 className="text-5xl font-extrabold tracking-tighter text-[#001d3d] mb-5 leading-tight">
          Wissen für smarte{' '}
          <span className="text-[#ff6b00]">Immobilien-Investoren</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Rendite, Cashflow, Finanzierung und mehr — fundierte Artikel, damit du
          die richtigen Entscheidungen triffst.
        </p>
      </section>

      {/* Articles */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        {posts.length === 0 ? (
          <p className="text-center text-gray-400 py-16">
            Noch keine Artikel vorhanden.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#ff6b00]/30 transition-all duration-200 flex flex-col"
              >
                {/* Date + Tags */}
                <div className="flex items-center gap-2 text-xs font-medium mb-3">
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

                {/* Title */}
                <h2 className="text-xl font-extrabold tracking-tight text-[#001d3d] mb-3 leading-snug">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-[#ff6b00] transition-colors"
                  >
                    {post.title}
                  </Link>
                </h2>

                {/* Description */}
                {post.description && (
                  <p className="text-sm text-gray-500 mb-5 flex-1 leading-relaxed">
                    {post.description}
                  </p>
                )}

                {/* Weiterlesen */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff6b00] hover:text-[#e05e00] transition-colors mt-auto"
                >
                  Weiterlesen
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
