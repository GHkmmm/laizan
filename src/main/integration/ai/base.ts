export interface AIService {
  analyzeVideoType(videoInfo: string, customPrompt?: string): Promise<{ shouldWatch: boolean }>
}

export interface AIServiceConstructor {
  new ({ apiKey, model }: { apiKey: string; model: string }): AIService
}

/**
 * 抽象基类：统一实现 analyzeVideoType，子类只需实现 _request
 */
export abstract class BaseAIService implements AIService {
  protected readonly apiKey: string
  protected readonly model: string

  constructor({ apiKey, model }: { apiKey: string; model: string }) {
    this.apiKey = apiKey
    this.model = model
  }

  /**
   * 子类必须实现：调用各自 API 并返回字符串结果
   */
  protected abstract _request(content: string): Promise<string | null>

  /**
   * 公共逻辑：拼装 prompt、调用 _request、解析 JSON、异常兜底
   */
  async analyzeVideoType(
    videoInfo: string,
    customPrompt: string = ''
  ): Promise<{ shouldWatch: boolean }> {
    const prompt = `
      目标：根据视频信息，判断是否需要观看这个视频，最后按JSON格式 {"shouldWatch":true|false} 返回，只需要结果不需要多余的东西。

      规则：
      ${customPrompt}

      视频信息：
      ${videoInfo}
    `

    const result = await this._request(prompt)
    if (result === null) {
      return { shouldWatch: false }
    }

    try {
      return JSON.parse(result)
    } catch (error) {
      console.error(`解析结果：${result}失败，${error}`)
      return { shouldWatch: false }
    }
  }
}
