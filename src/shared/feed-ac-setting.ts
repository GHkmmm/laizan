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
  commentTexts: string[]
  commentImagePath?: string
  commentImageType: 'folder' | 'file'
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
