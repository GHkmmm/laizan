import { storage, StorageKey } from '../../utils/storage'

export type RuleField = 'nickName' | 'videoDesc' | 'videoTag'

export interface FeedAcRule {
  field: RuleField
  keyword: string
}

export interface FeedAcSettings {
  blockKeywords: string[]
  authorBlockKeywords: string[]
  ruleRelation: 'and' | 'or'
  rules: FeedAcRule[]
  simulateWatchBeforeComment: boolean
  watchTimeRangeSeconds: [number, number]
  onlyCommentActiveVideo: boolean
}

function getDefaults(): FeedAcSettings {
  return {
    blockKeywords: [],
    authorBlockKeywords: [],
    ruleRelation: 'and',
    rules: [],
    simulateWatchBeforeComment: true,
    watchTimeRangeSeconds: [5, 15],
    onlyCommentActiveVideo: true
  }
}

export function getFeedAcSettings(): FeedAcSettings {
  const saved = storage.get(StorageKey.settings) as Partial<FeedAcSettings> | undefined
  const defaults = getDefaults()
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
        : defaults.watchTimeRangeSeconds
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
        : current.watchTimeRangeSeconds
  }
  storage.set(StorageKey.settings, next)
  return next
}
