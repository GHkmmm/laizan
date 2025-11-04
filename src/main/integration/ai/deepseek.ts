import { BaseAIService } from './base'

export class DeepSeekService extends BaseAIService {
  protected async _request(content: string): Promise<string | null> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      console.error('🛜 请求失败:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    return data.choices[0].message.content
  }
}
