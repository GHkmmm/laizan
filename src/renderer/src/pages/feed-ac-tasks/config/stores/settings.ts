import { defineStore } from 'pinia'
import { ref } from 'vue'
import { FeedAcSettingsV2, FeedAcRuleGroups } from '@/shared/feed-ac-setting'
import { deepClone } from '@/utils/common'

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

  const resetSettings = async (): Promise<void> => {
    settings.value = await window.api.clearFeedAcSettings()
  }

  // ============= 规则组操作 =============

  /**
   * 创建规则组
   */
  const createRuleGroup = async (
    ruleGroupData: Omit<FeedAcRuleGroups, 'id'>,
    parentId?: string
  ): Promise<boolean> => {
    const result = await window.api.createRuleGroup(deepClone(ruleGroupData), parentId)
    if (result.ok && result.data) {
      settings.value = result.data
      return true
    }
    console.error('创建规则组失败:', result.message)
    return false
  }

  /**
   * 更新规则组
   */
  const updateRuleGroup = async (
    id: string,
    updates: Partial<Omit<FeedAcRuleGroups, 'id'>>
  ): Promise<boolean> => {
    const result = await window.api.updateRuleGroup(id, deepClone(updates))
    if (result.ok && result.data) {
      settings.value = result.data
      return true
    }
    console.error('更新规则组失败:', result.message)
    return false
  }

  /**
   * 删除规则组
   */
  const deleteRuleGroup = async (id: string): Promise<boolean> => {
    const result = await window.api.deleteRuleGroup(id)
    if (result.ok && result.data) {
      settings.value = result.data
      return true
    }
    console.error('删除规则组失败:', result.message)
    return false
  }

  /**
   * 复制规则组
   */
  const copyRuleGroup = async (id: string, parentId?: string): Promise<boolean> => {
    const result = await window.api.copyRuleGroup(id, parentId)
    if (result.ok && result.data) {
      settings.value = result.data
      return true
    }
    console.error('复制规则组失败:', result.message)
    return false
  }

  // ============= 其他配置字段更新 =============

  /**
   * 更新除规则组外的配置
   */
  const updateExceptRuleGroup = async (
    updates: Partial<Omit<FeedAcSettingsV2, 'ruleGroups' | 'version'>>
  ): Promise<boolean> => {
    const result = await window.api.updateExceptRuleGroup(deepClone(updates))
    if (result.ok && result.data) {
      settings.value = result.data
      return true
    }
    console.error('更新配置失败:', result.message)
    return false
  }

  return {
    settings,
    loadSettings,
    resetSettings,
    onSettingsLoaded,
    createRuleGroup,
    updateRuleGroup,
    deleteRuleGroup,
    copyRuleGroup,
    updateExceptRuleGroup
  }
})
