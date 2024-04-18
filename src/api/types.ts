export type ChatRole = 'system' | 'assistant' | 'user';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  response: string;
}
