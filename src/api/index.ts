export interface APIClient {
  fetchChat(messages: ChatMessage[]): AsyncGenerator<string | undefined>;
  fetchCompletions(prefix: string, suffix: string): Promise<string | undefined>;
}

export type ChatRole = 'system' | 'assistant' | 'user';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  response: string;
}
