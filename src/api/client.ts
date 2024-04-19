import { ChatMessage } from '../types';

export interface APIClient {
  fetchChat(messages: ChatMessage[]): AsyncGenerator<string | undefined>;
  fetchCompletions(
    language: string,
    prefix: string,
    suffix: string,
  ): Promise<string | undefined>;
}
