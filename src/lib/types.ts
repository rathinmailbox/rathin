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

/** Where a scrolling ad can appear.
 *  - home:     stacked at the bottom of the homepage
 *  - home-top: stacked right below the masthead logo on the homepage
 *  - inline:   inside a specific article at a chosen paragraph
 */
export type AdPlacement = 'home' | 'home-top' | 'inline'

/** A scrolling advertisement, with dates serialized as ISO strings. */
export interface Advertisement {
  id: string
  text: string
  link: string | null
  bgColor: string
  textColor: string
  speed: number
  placement: AdPlacement
  postId: string | null
  paragraphNum: number | null
  enabled: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export type View = 'home' | 'article' | 'about' | 'admin'
