import { defineStore } from 'pinia'
import { ref } from 'vue'
import { FeedAcSettingsV2, getDefaultFeedAcSettingsV2 } from '@/shared/feed-ac-setting'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<FeedAcSettingsV2>(getDefaultFeedAcSettingsV2())

  // 保持向后兼容的 v1 方法
  const loadSettings = async (): Promise<void> => {
    settings.value = await window.api.getFeedAcSettings()
  }

  const saveSettings = async (): Promise<void> => {
    settings.value = await window.api.updateFeedAcSettings(
      JSON.parse(JSON.stringify(settings.value))
    )
  }

  const resetSettings = async (): Promise<void> => {
    settings.value = await window.api.clearFeedAcSettings()
  }

  return {
    settings,
    loadSettings,
    saveSettings,
    resetSettings
  }
})
