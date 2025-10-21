export type AiPlatform = 'volcengine' | 'bailian' | 'openai'

export interface AiSettings {
  platform: AiPlatform
  model: string
  apiKeys: Record<AiPlatform, string>
}

export const PLATFORM_MODELS: Record<AiPlatform, string[]> = {
  volcengine: ['doubao-seed-1.6-250615'],
  bailian: [],
  openai: []
}
