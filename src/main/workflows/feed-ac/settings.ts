import { storage, StorageKey } from '../../utils/storage'
import {
  type FeedAcSettingsV2,
  getDefaultFeedAcSettingsV2,
  getUnifiedFeedAcSettings,
  detectConfigVersion
} from '@/shared/feed-ac-setting'

export function getFeedAcSettings(): FeedAcSettingsV2 {
  const saved = storage.get(StorageKey.feedAcSetting)
  if (!saved) {
    return getDefaultFeedAcSettingsV2()
  }

  // 检测版本并自动迁移
  const version = detectConfigVersion(saved)
  if (version === 'v1') {
    console.log('检测到 v1 配置，正在自动迁移到 v2...')
    const migrated = getUnifiedFeedAcSettings(saved)
    // 自动保存迁移后的配置
    storage.set(StorageKey.feedAcSetting, migrated)
    return migrated
  }

  if (version === 'v2') {
    return saved as FeedAcSettingsV2
  }

  // 未知版本，返回默认配置
  return getDefaultFeedAcSettingsV2()
}

export function updateFeedAcSettings(partial: Partial<FeedAcSettingsV2>): FeedAcSettingsV2 {
  console.log('更新 v2 设置：', partial)
  const current = getFeedAcSettings()
  const next: FeedAcSettingsV2 = {
    ...current,
    ...partial,
    version: 'v2', // 确保版本标识
    // normalize arrays if provided
    blockKeywords: Array.isArray(partial.blockKeywords)
      ? partial.blockKeywords
      : current.blockKeywords,
    authorBlockKeywords: Array.isArray(partial.authorBlockKeywords)
      ? partial.authorBlockKeywords
      : current.authorBlockKeywords,
    ruleGroups: Array.isArray(partial.ruleGroups) ? partial.ruleGroups : current.ruleGroups,
    watchTimeRangeSeconds:
      Array.isArray(partial.watchTimeRangeSeconds) && partial.watchTimeRangeSeconds.length === 2
        ? (partial.watchTimeRangeSeconds as [number, number])
        : current.watchTimeRangeSeconds
  }
  storage.set(StorageKey.feedAcSetting, next)
  return next
}

export function clearFeedAcSettings(): FeedAcSettingsV2 {
  storage.delete(StorageKey.feedAcSetting)
  return getDefaultFeedAcSettingsV2()
}
