/** A blog post, with dates serialized as ISO strings (safe for client/server). */
export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  author: string
  category: string
  tags: string
  published: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
}

/** Editable site-wide settings. */
export interface SiteSettings {
  siteName: string
  tagline: string
  about: string
  accent: string
}

export type View = 'home' | 'article' | 'about' | 'admin'
