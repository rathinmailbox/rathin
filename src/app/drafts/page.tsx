import type { Metadata } from 'next'
import { getDraftsContent } from '@/lib/drafts-db'
import { DraftsClient } from '@/components/drafts/drafts-client'

export const metadata: Metadata = {
  title: 'Drafts • rathin.blog',
  description: 'Unpublished working drafts, evolving arguments, and field notes by Rathin.',
  keywords: ['drafts', 'notes', 'ideas', 'rathin.blog', 'working stream'],
}

// Ensure page always fetches fresh content from the database on request
export const dynamic = 'force-dynamic'

export default async function DraftsPage() {
  const data = await getDraftsContent()

  return (
    <DraftsClient
      initialContent={data.content}
      initialUpdatedAt={data.updatedAt}
    />
  )
}
