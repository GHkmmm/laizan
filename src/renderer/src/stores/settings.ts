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
  const simulateWatchBeforeComment = ref<boolean>(true)
  const watchTimeRangeSeconds = ref<[number, number]>([5, 15])
  const onlyCommentActiveVideo = ref<boolean>(true)

  // 关键词屏蔽
  const authorKeywords = ref<string[]>([])
  const descKeywords = ref<string[]>([])

  const loadSettings = async (): Promise<void> => {
    const s = await window.api.getSettings()
    authorKeywords.value = s?.authorBlockKeywords || []
    descKeywords.value = s?.blockKeywords || []
    ruleRelation.value = (s?.ruleRelation as 'and' | 'or') ?? 'or'
    rules.value = Array.isArray(s?.rules) ? s!.rules : []
    simulateWatchBeforeComment.value = s?.simulateWatchBeforeComment ?? true
    watchTimeRangeSeconds.value =
      Array.isArray(s?.watchTimeRangeSeconds) && s!.watchTimeRangeSeconds.length === 2
        ? (s!.watchTimeRangeSeconds as [number, number])
        : [5, 15]
    onlyCommentActiveVideo.value = s?.onlyCommentActiveVideo ?? true
  }

  const saveSettings = async (): Promise<void> => {
    const next = await window.api.updateSettings({
      authorBlockKeywords: [...authorKeywords.value],
      blockKeywords: [...descKeywords.value],
      ruleRelation: ruleRelation.value,
      rules: JSON.parse(JSON.stringify(rules.value)),
      simulateWatchBeforeComment: simulateWatchBeforeComment.value,
      watchTimeRangeSeconds: [...watchTimeRangeSeconds.value],
      onlyCommentActiveVideo: onlyCommentActiveVideo.value
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
  }

  const addRule = (): void => {
    rules.value.push({ field: 'videoDesc', keyword: '' })
  }

  const removeRule = (index: number): void => {
    rules.value.splice(index, 1)
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
    // 方法
    loadSettings,
    saveSettings,
    addRule,
    removeRule
  }
})
