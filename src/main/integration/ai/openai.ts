import { BaseAIService } from './base'

export class OpenAIService extends BaseAIService {
  protected async _request(): Promise<string | null> {
    throw new Error('Method not implemented.')
  }
}
