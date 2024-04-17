import { CHAT_COMPLETIONS_MODELS, COMPLETIONS_MODELS } from './openai';

export type CompletionsModel = (typeof COMPLETIONS_MODELS)[number];

export type ChatCompletionsModel = (typeof CHAT_COMPLETIONS_MODELS)[number];

export type ChatRole = 'system' | 'assistant' | 'user';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  response: string;
}

export interface APIClient {
  fetchChat(messages: ChatMessage[]): AsyncGenerator<string | undefined>;
  fetchCompletions(
    language: string,
    prefix: string,
    suffix: string,
  ): Promise<string | undefined>;
}
