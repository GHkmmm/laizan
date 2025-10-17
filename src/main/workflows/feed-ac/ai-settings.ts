import { storage, StorageKey } from '../../utils/storage'
import { AiSettings, AiPlatform, PLATFORM_MODELS } from '@shared/ai-setting'

export function getAiDefaults(): AiSettings {
  return {
    platform: 'volcengine',
    model: 'doubao-seed-1.6-250615',
    apiKeys: {
      volcengine: '',
      bailian: '',
      openai: ''
    }
  }
}

export function getAiSettings(): AiSettings {
  const saved = storage.get(StorageKey.aiSettings) as Partial<AiSettings> | undefined
  const defaults = getAiDefaults()
  const platform = (saved?.platform as AiPlatform) || defaults.platform
  const candidates = PLATFORM_MODELS[platform]
  const model = candidates.includes(saved?.model || '') ? (saved!.model as string) : defaults.model
  const apiKeys = {
    ...defaults.apiKeys,
    ...(saved?.apiKeys || {})
  }
  return { platform, model, apiKeys }
}

export function updateAiSettings(partial: Partial<AiSettings>): AiSettings {
  const current = getAiSettings()
  const nextPlatform = (partial.platform as AiPlatform) || current.platform
  const candidates = PLATFORM_MODELS[nextPlatform]
  const nextModel = partial.model ?? current.model
  if (!candidates.includes(nextModel)) {
    throw new Error('所选模型与平台不匹配')
  }

  const next: AiSettings = {
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

export function resetAiSettings(): AiSettings {
  const defaults = getAiDefaults()
  storage.set(StorageKey.aiSettings, defaults)
  return defaults
}


