export type AIPlatform = 'volcengine' | 'bailian' | 'openai'

export interface AISettings {
  platform: AIPlatform
  model: string
  apiKeys: Record<AIPlatform, string>
}

export const PLATFORM_MODELS: Record<AIPlatform, string[]> = {
  volcengine: ['doubao-seed-1.6-250615'],
  bailian: [],
  openai: []
}

export function getDefaultAISetting(): AISettings {
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
