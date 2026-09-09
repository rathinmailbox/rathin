import { db } from './db'
import { DEFAULT_DRAFTS_CONTENT } from './drafts-default'

export async function getDraftsContent(): Promise<{
  content: string
  updatedAt: string
}> {
  try {
    const draftPage = await db.draftPage.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        content: DEFAULT_DRAFTS_CONTENT,
      },
    })

    return {
      content: draftPage.content,
      updatedAt: draftPage.updatedAt.toISOString(),
    }
  } catch (err) {
    console.error('Failed to query draftPage from database, returning default fallback:', err)
    return {
      content: DEFAULT_DRAFTS_CONTENT,
      updatedAt: new Date().toISOString(),
    }
  }
}

export async function saveDraftsContent(content: string): Promise<{
  content: string
  updatedAt: string
}> {
  const draftPage = await db.draftPage.upsert({
    where: { id: 'default' },
    update: { content },
    create: { id: 'default', content },
  })

  return {
    content: draftPage.content,
    updatedAt: draftPage.updatedAt.toISOString(),
  }
}
