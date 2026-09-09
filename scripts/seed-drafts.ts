import { saveDraftsContent } from '../src/lib/drafts-db'
import { DEFAULT_DRAFTS_CONTENT } from '../src/lib/drafts-default'

async function reset() {
  await saveDraftsContent(DEFAULT_DRAFTS_CONTENT)
  console.log('✅ Drafts restored to full default editorial stream.')
  process.exit(0)
}

reset()
