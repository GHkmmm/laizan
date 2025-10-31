import { defineStore } from 'pinia'
import { ref } from 'vue'
import { FeedAcSettingsV2 } from '@/shared/feed-ac-setting'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<FeedAcSettingsV2>()

  // 配置加载完成后的回调函数
  let onSettingsLoadedCallback: (() => void) | null = null

  // 注册配置加载完成的回调
  const onSettingsLoaded = (callback: () => void): void => {
    onSettingsLoadedCallback = callback
  }

  const loadSettings = async (): Promise<void> => {
    settings.value = await window.api.getFeedAcSettings()
    // 触发配置加载完成的回调
    if (onSettingsLoadedCallback) {
      onSettingsLoadedCallback()
    }
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
    resetSettings,
    onSettingsLoaded
  }
})
