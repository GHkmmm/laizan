export class ArkService {
  private readonly apiKey: string
  private readonly model: string

  constructor({ apiKey, model }: { apiKey: string; model: string }) {
    this.apiKey = apiKey
    this.model = model
  }

  private async _request(content: string): Promise<string | null> {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: content
              }
            ]
          }
        ],
        thinking: {
          type: 'disabled'
        }
      })
    })

    if (!response.ok) {
      // throw new Error(`HTTP error! status: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.choices[0].message.content
  }
  async analyzeVideoType(
    videoInfo: string,
    customPrompt: string = ''
  ): Promise<{ shouldWatch: boolean }> {
    const prompt = `
目标： 根据视频信息，判断是否需要观看这个视频，最后按照格式{"shouldWatch":true|false}返回json数据

规则： 
${customPrompt}

视频信息：
${videoInfo}
    `
    
    const result = await this._request(prompt)
    if (result === null) {
      return {
        shouldWatch: false
      }
    }
    
    try {
      return JSON.parse(result)
    } catch (error) {
      // 如果解析失败，默认不观看
      return {
        shouldWatch: false
      }
    }
  }
}
