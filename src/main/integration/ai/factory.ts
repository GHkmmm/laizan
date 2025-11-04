import { AIService, AIServiceConstructor } from './base'
import { ArkService } from './ark'
import { QwenService } from './qwen'
import { DeepSeekService } from './deepseek'
import { OpenAIService } from './openai'
import { AIPlatform } from '@/shared/ai-setting'

const serviceMap: Record<AIPlatform, AIServiceConstructor> = {
  volcengine: ArkService,
  bailian: QwenService,
  openai: OpenAIService,
  deepseek: DeepSeekService
}

export class AIServiceFactory {
  static createService(
    platform: AIPlatform,
    { apiKey, model }: { apiKey: string; model: string }
  ): AIService {
    const ServiceClass = serviceMap[platform]
    if (!ServiceClass) {
      throw new Error(`Unsupported AI platform: ${platform}`)
    }
    return new ServiceClass({ apiKey, model })
  }
}
