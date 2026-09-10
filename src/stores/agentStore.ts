import { createBusinessAgentStore, type ContextLoader, type ContentApprover } from './businessAgentStore'
import type { Chapter } from '@/types'
import type { SessionContext } from '@/agent/session/types'

const loadChapterContext: ContextLoader = async (chapterId: string | null): Promise<SessionContext> => {
  let existingContent: Chapter | null = null

  if (chapterId) {
    try {
      const useAutobiographyStore = (await import('./autobiographyStore')).default
      const store = useAutobiographyStore.getState()
      existingContent = store.autobiography?.chapters.find((c: Chapter) => c.id === chapterId) ?? null
    } catch {
      existingContent = null
    }
  }

  return {
    chapterId,
    existingContent,
    userPreferences: {
      style: 'casual',
      language: 'zh',
      perspective: 'first',
      autoExtract: true
    },
    timelineContext: {
      currentEra: undefined,
      keyEvents: undefined,
      characterAges: undefined
    },
    extractedCache: []
  }
}

const onApproveContent: ContentApprover = async (chapterId: string) => {
  const useAutobiographyStore = (await import('./autobiographyStore')).default
  await useAutobiographyStore.getState().confirmChapterDraft(chapterId)
}

export const useAgentStore = createBusinessAgentStore({
  defaultSkill: 'deep_interview',
  contextLoader: loadChapterContext,
  onApproveContent
})

export type { BusinessAgentState, BusinessAgentActions, CreateBusinessAgentStoreOptions } from './businessAgentStore'
