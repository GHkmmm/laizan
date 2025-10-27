import { ref, Ref, onMounted } from 'vue'
import { AIPlatform, AISettings, PLATFORM_MODELS } from '@/shared/ai-setting'

interface UseAiSettingsReturn {
  aiSettings: Ref<AISettings | null>
  isAiConfigured: Ref<boolean>
  loading: Ref<boolean>
  error: Ref<string | null>
  refresh: () => Promise<void>
}

/**
 * 自定义hooks用于获取和验证AI设置
 * @returns 包含AI设置状态和操作方法的对象
 */
export function useAiSettings(): UseAiSettingsReturn {
  const aiSettings = ref<AISettings | null>(null)
  const isAiConfigured = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 获取AI设置并验证配置状态
   */
  const fetchAiSettings = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const settings = await window.api.getAISettings()
      aiSettings.value = settings
      isAiConfigured.value = isAiSettingsConfigured(settings)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取AI设置失败'
      aiSettings.value = null
      isAiConfigured.value = false
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新AI设置
   */
  const refresh = async (): Promise<void> => {
    await fetchAiSettings()
  }

  const isAiSettingsConfigured = (settings: AISettings): boolean => {
    // 检查平台是否有效
    if (!settings.platform || !['volcengine', 'bailian', 'openai'].includes(settings.platform)) {
      return false
    }

    // 检查模型是否有效
    const candidates = PLATFORM_MODELS[settings.platform as AIPlatform]
    if (!candidates.includes(settings.model)) {
      return false
    }

    // 检查API密钥是否已配置
    if (!settings.apiKeys[settings.platform]) {
      return false
    }

    // 检查API密钥是否非空
    return settings.apiKeys[settings.platform].trim().length > 0
  }

  // 组件挂载时自动获取AI设置
  onMounted(() => {
    fetchAiSettings()
  })

  return {
    aiSettings,
    isAiConfigured,
    loading,
    error,
    refresh
  }
}
