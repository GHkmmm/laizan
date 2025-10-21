import { storage, StorageKey } from '../../utils/storage'
import type { FeedAcSettings, FeedAcRule } from '@shared/feed-ac-setting'

export function getFeedAcDefaults(): FeedAcSettings {
  return {
    blockKeywords: [],
    authorBlockKeywords: [],
    ruleRelation: 'or',
    rules: [],
    simulateWatchBeforeComment: false,
    watchTimeRangeSeconds: [5, 15],
    onlyCommentActiveVideo: false,
    enableAIVideoFilter: false,
    customAIVideoFilterPrompt: '',
    commentTexts: [],
    commentImagePath: undefined,
    commentImageType: 'folder',
    dontShowDouyinLimitDialog: false
  }
}

export function getFeedAcSettings(): FeedAcSettings {
  const saved = storage.get(StorageKey.feedAcSetting) as Partial<FeedAcSettings> | undefined
  const defaults = getFeedAcDefaults()
  const merged: FeedAcSettings = {
    ...defaults,
    ...(saved || {}),
    // normalize arrays
    blockKeywords: Array.isArray(saved?.blockKeywords)
      ? saved!.blockKeywords!
      : defaults.blockKeywords,
    authorBlockKeywords: Array.isArray(saved?.authorBlockKeywords)
      ? saved!.authorBlockKeywords!
      : defaults.authorBlockKeywords,
    rules: Array.isArray(saved?.rules) ? (saved!.rules as FeedAcRule[]) : defaults.rules,
    watchTimeRangeSeconds:
      Array.isArray(saved?.watchTimeRangeSeconds) && saved!.watchTimeRangeSeconds!.length === 2
        ? (saved!.watchTimeRangeSeconds as [number, number])
        : defaults.watchTimeRangeSeconds,
    commentTexts: Array.isArray(saved?.commentTexts) ? saved!.commentTexts! : defaults.commentTexts,
    commentImagePath: saved?.commentImagePath || defaults.commentImagePath,
    commentImageType: saved?.commentImageType || defaults.commentImageType
  }
  return merged
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
      : current.authorBlockKeywords,
    rules: Array.isArray(partial.rules) ? (partial.rules as FeedAcRule[]) : current.rules,
    watchTimeRangeSeconds:
      Array.isArray(partial.watchTimeRangeSeconds) && partial.watchTimeRangeSeconds.length === 2
        ? (partial.watchTimeRangeSeconds as [number, number])
        : current.watchTimeRangeSeconds,
    commentTexts: Array.isArray(partial.commentTexts) ? partial.commentTexts : current.commentTexts,
    commentImagePath:
      partial.commentImagePath !== undefined ? partial.commentImagePath : current.commentImagePath,
    commentImageType: partial.commentImageType || current.commentImageType
  }
  storage.set(StorageKey.feedAcSetting, next)
  return next
}

export function clearFeedAcSettings(): FeedAcSettings {
  storage.delete(StorageKey.feedAcSetting)
  return getFeedAcDefaults()
}
