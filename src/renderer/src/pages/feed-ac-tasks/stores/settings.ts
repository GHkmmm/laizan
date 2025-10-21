import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Rule {
  field: 'nickName' | 'videoDesc' | 'videoTag'
  keyword: string
}

export const useSettingsStore = defineStore('settings', () => {
  // 规则设置
  const ruleRelation = ref<'and' | 'or'>('or')
  const rules = ref<Rule[]>([])
  const simulateWatchBeforeComment = ref<boolean>(false)
  const watchTimeRangeSeconds = ref<[number, number]>([5, 15])
  const onlyCommentActiveVideo = ref<boolean>(false)

  // 关键词屏蔽
  const authorKeywords = ref<string[]>([])
  const descKeywords = ref<string[]>([])

  // AI视频过滤
  const enableAIVideoFilter = ref<boolean>(false)
  const customAIVideoFilterPrompt = ref<string>('')

  // 评论内容配置
  const commentTexts = ref<string[]>([])
  const commentImagePath = ref<string | undefined>(undefined)
  const commentImageType = ref<'folder' | 'file'>('folder')

  // 弹窗设置
  const dontShowDouyinLimitDialog = ref<boolean>(false)

  const loadSettings = async (): Promise<void> => {
    const s = await window.api.getFeedAcSettings()
    authorKeywords.value = s.authorBlockKeywords
    descKeywords.value = s.blockKeywords
    ruleRelation.value = s.ruleRelation
    rules.value = s.rules
    simulateWatchBeforeComment.value = s.simulateWatchBeforeComment
    watchTimeRangeSeconds.value = s.watchTimeRangeSeconds
    onlyCommentActiveVideo.value = s.onlyCommentActiveVideo
    enableAIVideoFilter.value = s.enableAIVideoFilter
    customAIVideoFilterPrompt.value = s.customAIVideoFilterPrompt
    commentTexts.value = s.commentTexts
    commentImagePath.value = s.commentImagePath
    commentImageType.value = s.commentImageType
    dontShowDouyinLimitDialog.value = s.dontShowDouyinLimitDialog ?? false
  }

  const saveSettings = async (): Promise<void> => {
    const next = await window.api.updateFeedAcSettings({
      authorBlockKeywords: [...authorKeywords.value],
      blockKeywords: [...descKeywords.value],
      ruleRelation: ruleRelation.value,
      rules: JSON.parse(JSON.stringify(rules.value)),
      simulateWatchBeforeComment: simulateWatchBeforeComment.value,
      watchTimeRangeSeconds: [...watchTimeRangeSeconds.value],
      onlyCommentActiveVideo: onlyCommentActiveVideo.value,
      enableAIVideoFilter: enableAIVideoFilter.value,
      customAIVideoFilterPrompt: customAIVideoFilterPrompt.value,
      commentTexts: [...commentTexts.value],
      commentImagePath: commentImagePath.value,
      commentImageType: commentImageType.value,
      dontShowDouyinLimitDialog: dontShowDouyinLimitDialog.value
    })
    authorKeywords.value = next.authorBlockKeywords || []
    descKeywords.value = next.blockKeywords || []
    ruleRelation.value = (next.ruleRelation as 'and' | 'or') ?? 'or'
    rules.value = Array.isArray(next.rules) ? next.rules : []
    simulateWatchBeforeComment.value = next.simulateWatchBeforeComment ?? true
    watchTimeRangeSeconds.value =
      Array.isArray(next.watchTimeRangeSeconds) && next.watchTimeRangeSeconds.length === 2
        ? (next.watchTimeRangeSeconds as [number, number])
        : [5, 15]
    onlyCommentActiveVideo.value = next.onlyCommentActiveVideo ?? true
    enableAIVideoFilter.value = next.enableAIVideoFilter ?? false
    customAIVideoFilterPrompt.value = next.customAIVideoFilterPrompt ?? ''
    commentTexts.value = Array.isArray(next.commentTexts) ? next.commentTexts : []
    commentImagePath.value = next.commentImagePath
    commentImageType.value = next.commentImageType || 'folder'
    dontShowDouyinLimitDialog.value = next.dontShowDouyinLimitDialog ?? false
  }

  const resetSettings = async (): Promise<void> => {
    const next = await window.api.clearFeedAcSettings()
    authorKeywords.value = next.authorBlockKeywords || []
    descKeywords.value = next.blockKeywords || []
    ruleRelation.value = (next.ruleRelation as 'and' | 'or') ?? 'or'
    rules.value = Array.isArray(next.rules) ? next.rules : []
    simulateWatchBeforeComment.value = next.simulateWatchBeforeComment ?? true
    watchTimeRangeSeconds.value =
      Array.isArray(next.watchTimeRangeSeconds) && next.watchTimeRangeSeconds.length === 2
        ? (next.watchTimeRangeSeconds as [number, number])
        : [5, 15]
    onlyCommentActiveVideo.value = next.onlyCommentActiveVideo ?? true
    enableAIVideoFilter.value = next.enableAIVideoFilter ?? false
    customAIVideoFilterPrompt.value = next.customAIVideoFilterPrompt ?? ''
    commentTexts.value = Array.isArray(next.commentTexts) ? next.commentTexts : []
    commentImagePath.value = next.commentImagePath
    commentImageType.value = next.commentImageType || 'folder'
    dontShowDouyinLimitDialog.value = next.dontShowDouyinLimitDialog ?? false
  }

  const addRule = (): void => {
    rules.value.push({ field: 'videoDesc', keyword: '' })
    saveSettings()
  }

  const removeRule = (index: number): void => {
    rules.value.splice(index, 1)
    saveSettings()
  }

  // 评论内容相关方法
  const addCommentText = (text: string): void => {
    commentTexts.value.push(text)
    saveSettings()
  }

  const removeCommentText = (index: number): void => {
    commentTexts.value.splice(index, 1)
    saveSettings()
  }

  const updateCommentTexts = (texts: string[]): void => {
    commentTexts.value = [...texts]
    saveSettings()
  }

  const updateCommentImagePath = (path: string | undefined): void => {
    commentImagePath.value = path
    saveSettings()
  }

  const updateCommentImageType = (type: 'folder' | 'file'): void => {
    commentImageType.value = type
    saveSettings()
  }

  return {
    // 规则设置
    ruleRelation,
    rules,
    simulateWatchBeforeComment,
    watchTimeRangeSeconds,
    onlyCommentActiveVideo,
    // 关键词屏蔽
    authorKeywords,
    descKeywords,
    // AI视频过滤
    enableAIVideoFilter,
    customAIVideoFilterPrompt,
    // 评论内容配置
    commentTexts,
    commentImagePath,
    commentImageType,
    // 弹窗设置
    dontShowDouyinLimitDialog,
    // 方法
    loadSettings,
    saveSettings,
    addRule,
    removeRule,
    resetSettings,
    addCommentText,
    removeCommentText,
    updateCommentTexts,
    updateCommentImagePath,
    updateCommentImageType
  }
})
