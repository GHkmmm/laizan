import { defineStore } from 'pinia'
import { ref } from 'vue'
import { FeedAcSettings } from '@shared/feed-ac-setting'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<FeedAcSettings>({
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
  })

  const loadSettings = async (): Promise<void> => {
    settings.value = await window.api.getFeedAcSettings()
  }

  const saveSettings = async (): Promise<void> => {
    settings.value = await window.api.updateFeedAcSettings(settings.value)
  }

  const resetSettings = async (): Promise<void> => {
    settings.value = await window.api.clearFeedAcSettings()
  }

  const addRule = (): void => {
    settings.value.rules.push({ field: 'videoDesc', keyword: '' })
    saveSettings()
  }

  const removeRule = (index: number): void => {
    settings.value.rules.splice(index, 1)
    saveSettings()
  }

  // 评论内容相关方法
  const addCommentText = (text: string): void => {
    settings.value.commentTexts.push(text)
    saveSettings()
  }

  const removeCommentText = (index: number): void => {
    settings.value.commentTexts.splice(index, 1)
    saveSettings()
  }

  const updateCommentTexts = (texts: string[]): void => {
    settings.value.commentTexts = [...texts]
    saveSettings()
  }

  const updateCommentImagePath = (path: string | undefined): void => {
    settings.value.commentImagePath = path
    saveSettings()
  }

  const updateCommentImageType = (type: 'folder' | 'file'): void => {
    settings.value.commentImageType = type
    saveSettings()
  }

  return {
    settings,
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
