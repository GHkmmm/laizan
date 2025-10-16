import { storage, StorageKey } from '../../utils/storage'

export interface FeedAcSettings {
  blockKeywords: string[]
  authorBlockKeywords: string[]
}
export function getFeedAcSettings(): FeedAcSettings {
  return storage.get(StorageKey.settings)
}

export function updateFeedAcSettings(partial: Partial<FeedAcSettings>): FeedAcSettings {
  console.log('更新设置：', partial)
  const current = getFeedAcSettings()
  const next: FeedAcSettings = {
    ...current,
    ...partial,
    // normalize arrays if provided
    blockKeywords: Array.isArray(partial.blockKeywords)
      ? partial.blockKeywords
      : current.blockKeywords,
    authorBlockKeywords: Array.isArray(partial.authorBlockKeywords)
      ? partial.authorBlockKeywords
      : current.authorBlockKeywords
  }
  storage.set(StorageKey.settings, next)
  return next
}
