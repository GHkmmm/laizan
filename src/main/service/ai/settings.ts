import { storage, StorageKey } from '../../utils/storage'
import { AISettings, AIPlatform, PLATFORM_MODELS } from '@/shared/ai-setting'
export function getAISettings(): AISettings {
  const saved = storage.get(StorageKey.aiSettings) as Partial<AISettings> | undefined
  const defaults = getDefaultAISetting()
  const platform = (saved?.platform as AIPlatform) || defaults.platform
  const candidates = PLATFORM_MODELS[platform]
  const model = candidates.includes(saved?.model || '') ? (saved!.model as string) : defaults.model
  const apiKeys = {
    ...defaults.apiKeys,
    ...(saved?.apiKeys || {})
  }
  return { platform, model, apiKeys }
}

export function updateAISettings(partial: Partial<AISettings>): AISettings {
  const current = getAISettings()
  const nextPlatform = (partial.platform as AIPlatform) || current.platform
  const candidates = PLATFORM_MODELS[nextPlatform]
  const nextModel = partial.model ?? current.model
  if (!candidates.includes(nextModel)) {
    throw new Error('所选模型与平台不匹配')
  }

  const next: AISettings = {
    platform: nextPlatform,
    model: nextModel,
    apiKeys: {
      ...current.apiKeys,
      ...(partial.apiKeys || {})
    }
  }
  storage.set(StorageKey.aiSettings, next)
  return next
}

export function resetAiSettings(): AISettings {
  const defaults = getDefaultAISetting()
  storage.set(StorageKey.aiSettings, defaults)
  return defaults
}

export function getDefaultAISetting(): AISettings {
  return {
    platform: 'volcengine',
    model: 'doubao-seed-1.6-250615',
    apiKeys: {
      volcengine: '',
      bailian: '',
      openai: '',
      deepseek: ''
    }
  }
}
