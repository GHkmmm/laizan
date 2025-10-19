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
  enableAIVideoFilter: boolean
  customAIVideoFilterPrompt: string
}