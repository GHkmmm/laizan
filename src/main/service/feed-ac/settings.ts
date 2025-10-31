import { storage, StorageKey } from '../../utils/storage'
import {
  type FeedAcSettingsV2,
  FeedAcRuleGroups,
  FeedAcSettings,
  FeedAcSettingsUnion
} from '@/shared/feed-ac-setting'
import { customAlphabet } from 'nanoid'

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

export function getDefaultFeedAcSettingsV2(): FeedAcSettingsV2 {
  return {
    version: 'v2',
    ruleGroups: [],
    blockKeywords: [],
    authorBlockKeywords: [],
    simulateWatchBeforeComment: false,
    watchTimeRangeSeconds: [5, 15],
    onlyCommentActiveVideo: false,
    maxCount: 10
  }
}

// 检测配置版本
export function detectConfigVersion(config?: FeedAcSettingsUnion): 'v1' | 'v2' | 'unknown' {
  if (config && typeof config === 'object') {
    // v1 配置的特征：有 rules 数组但没有 version 字段
    if (!('version' in config) && 'rules' in config && Array.isArray(config.rules)) {
      return 'v1'
    }
    if ('version' in config && config.version === 'v2') {
      return 'v2'
    }
  }
  return 'unknown'
}

// 将 v1 配置迁移到 v2
export function migrateV1ToV2(v1Config: FeedAcSettings): FeedAcSettingsV2 {
  const nanoid = customAlphabet('1234567890abcdef', 16)

  // 创建默认规则组，将原有的 rules 迁移过来
  const defaultRuleGroup: FeedAcRuleGroups = {
    id: nanoid(),
    type: 'manual',
    name: '默认规则组',
    relation: v1Config.ruleRelation,
    rules: [...v1Config.rules],
    commentTexts: [...v1Config.commentTexts],
    commentImagePath: v1Config.commentImagePath,
    commentImageType: v1Config.commentImageType
  }

  return {
    version: 'v2',
    ruleGroups: v1Config.rules.length > 0 ? [defaultRuleGroup] : [],
    blockKeywords: [...v1Config.blockKeywords],
    authorBlockKeywords: [...v1Config.authorBlockKeywords],
    simulateWatchBeforeComment: v1Config.simulateWatchBeforeComment,
    watchTimeRangeSeconds: [...v1Config.watchTimeRangeSeconds],
    onlyCommentActiveVideo: v1Config.onlyCommentActiveVideo,
    maxCount: 10 // 默认值
  }
}

// 统一的配置获取函数，自动处理版本迁移
export function getUnifiedFeedAcSettings(config?: FeedAcSettingsUnion): FeedAcSettingsV2 {
  const version = detectConfigVersion(config)

  switch (version) {
    case 'v2':
      return config as unknown as FeedAcSettingsV2
    case 'v1':
      return migrateV1ToV2(config as unknown as FeedAcSettings)
    default:
      return getDefaultFeedAcSettingsV2()
  }
}
