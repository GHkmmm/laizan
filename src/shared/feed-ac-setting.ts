import { customAlphabet } from 'nanoid'

export type RuleField = 'nickName' | 'videoDesc' | 'videoTag'
export type RuleType = 'ai' | 'manual'

export interface FeedAcRule {
  field: RuleField
  keyword: string
}

// v2版本的规则结构
export interface FeedAcRuleGroups {
  id: string
  type: RuleType
  name: string
  children?: FeedAcRuleGroups[]
  // AI判断类型
  aiPrompt?: string
  // 手动配置类型
  relation?: 'and' | 'or'
  rules?: FeedAcRule[]
  // 评论内容（只有最底层规则才有）
  commentTexts?: string[]
  commentImagePath?: string
  commentImageType?: 'folder' | 'file'
}

// v1版本的配置结构（保持向后兼容）
export interface FeedAcSettings {
  blockKeywords: string[]
  authorBlockKeywords: string[]
  ruleRelation: 'and' | 'or'
  rules: FeedAcRule[]
  simulateWatchBeforeComment: boolean
  watchTimeRangeSeconds: [number, number]
  onlyCommentActiveVideo: boolean
  enableAIVideoFilter: boolean
  customAIVideoFilterPrompt: string
  commentTexts: string[]
  commentImagePath?: string
  commentImageType: 'folder' | 'file'
  dontShowDouyinLimitDialog?: boolean
}

// v2版本的配置结构
export interface FeedAcSettingsV2 {
  version: 'v2'
  ruleGroups: FeedAcRuleGroups[]
  blockKeywords: string[]
  authorBlockKeywords: string[]
  simulateWatchBeforeComment: boolean
  watchTimeRangeSeconds: [number, number]
  onlyCommentActiveVideo: boolean
  dontShowDouyinLimitDialog?: boolean
}

export function getDefaultFeedAcSettings(): FeedAcSettings {
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

export function getDefaultFeedAcSettingsV2(): FeedAcSettingsV2 {
  return {
    version: 'v2',
    ruleGroups: [],
    blockKeywords: [],
    authorBlockKeywords: [],
    simulateWatchBeforeComment: false,
    watchTimeRangeSeconds: [5, 15],
    onlyCommentActiveVideo: false,
    dontShowDouyinLimitDialog: false
  }
}

// 检测配置版本
export function detectConfigVersion(config?: FeedAcSettingsUnion): 'v1' | 'v2' | 'unknown' {
  if (config && typeof config === 'object') {
    // v1 配置的特征：有 rules 数组但没有 version 字段
    if (!('rules' in config) && 'rules' in config && Array.isArray(config.rules)) {
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
    dontShowDouyinLimitDialog: v1Config.dontShowDouyinLimitDialog
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

// 联合类型，支持两种版本
export type FeedAcSettingsUnion = FeedAcSettings | FeedAcSettingsV2
