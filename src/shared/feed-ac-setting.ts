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

export function getDefaults(): FeedAcSettings {
  return {
    blockKeywords: [],
    authorBlockKeywords: [],
    ruleRelation: 'or',
    rules: [],
    simulateWatchBeforeComment: true,
    watchTimeRangeSeconds: [5, 15],
    onlyCommentActiveVideo: true
  }
}
