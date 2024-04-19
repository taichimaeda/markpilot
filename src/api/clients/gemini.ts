import { APIClient, ChatMessage } from '..';

// TODO:
// Implement API client for Gemini.

export class GeminiAPIClient implements APIClient {
  fetchChat(messages: ChatMessage[]): AsyncGenerator<string | undefined> {
    throw new Error('Method not implemented.');
  }
  fetchCompletions(
    prefix: string,
    suffix: string,
  ): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
