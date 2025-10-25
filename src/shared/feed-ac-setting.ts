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

export function getDefaultFEedAcSettingsV2(): FeedAcSettingsV2 {
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
