import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  image?: string
  tags?: string[]
  draft?: boolean
  content: string
}

export type BlogPostMeta = Omit<BlogPost, 'content'>

function ensureBlogDir() {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true })
  }
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  ensureBlogDir()

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))

  const posts = files.map((file) => {
    const slug = file.replace(/\.(mdx|md)$/, '')
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
    const { data } = matter(raw)

    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? '',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      author: data.author ?? 'Imvestr',
      image: data.image ?? null,
      tags: data.tags ?? [],
      draft: data.draft ?? false,
    } as BlogPostMeta
  })

  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  ensureBlogDir()

  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`)
  const mdPath = path.join(BLOG_DIR, `${slug}.md`)
  const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null

  if (!filePath) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    author: data.author ?? 'Imvestr',
    image: data.image ?? null,
    tags: data.tags ?? [],
    draft: data.draft ?? false,
    content,
  }
}
