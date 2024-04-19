import { ChatMessage } from '../../types';
import { APIClient } from '../client';

// TODO:
// Implement API client for Gemini.

export class GeminiAPIClient implements APIClient {
  fetchChat(messages: ChatMessage[]): AsyncGenerator<string | undefined> {
    throw new Error('Method not implemented.');
  }
  fetchCompletions(
    language: string,
    prefix: string,
    suffix: string,
  ): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
