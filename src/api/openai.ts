import OpenAI from "openai";
import Markpilot from "src/main";

export const COMPLETIONS_MODELS = [
  "gpt-3.5-turbo-instruct",
  "davinci-002",
  "babbage-002",
] as const;

export const CHAT_COMPLETIONS_MODELS = [
  "gpt-4-0125-preview",
  "gpt-4-turbo-preview",
  "gpt-4-1106-preview",
  "gpt-4-vision-preview",
  "gpt-4",
  "gpt-4-0314",
  "gpt-4-0613",
  "gpt-4-32k",
  "gpt-4-32k-0314",
  "gpt-4-32k-0613",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo-0301",
  "gpt-3.5-turbo-0613",
  "gpt-3.5-turbo-1106",
  "gpt-3.5-turbo-0125",
  "gpt-3.5-turbo-16k-0613",
] as const;

export type CompletionsModel = (typeof COMPLETIONS_MODELS)[number];

export type ChatCompletionsModel = (typeof CHAT_COMPLETIONS_MODELS)[number];

export type ChatRole = "system" | "assistant" | "user";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  response: string;
}

export interface APIClient {
  reload(): Promise<void>;
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  fetchChat(messages: ChatMessage[]): AsyncGenerator<string | undefined>;
  fetchCompletions(
    language: string,
    prefix: string,
    suffix: string
  ): Promise<string | undefined>;
}

export class OpenAIClient implements APIClient {
  private openai: OpenAI | undefined;

  constructor(private plugin: Markpilot) {}

  async reload() {
    await this.destroy();
    await this.initialize();
  }

  async initialize() {
    const apiKey = this.plugin.settings.apiKey ?? "";
    this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  async destroy() {
    this.openai = undefined;
  }

  async *fetchChat(messages: ChatMessage[]) {
    if (this.openai === undefined) {
      return;
    }

    const { settings } = this.plugin;
    const stream = await this.openai.chat.completions.create({
      messages: [
        // {
        //   role: "system",
        //   content: defaultPrompt,
        // },
        ...messages,
      ],
      model: settings.chat.model,
      max_tokens: settings.chat.maxTokens,
      temperature: settings.chat.temperature,
      top_p: 1,
      n: 1,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0].delta.content ?? "";
      yield content;
    }
  }

  async fetchCompletions(language: string, prefix: string, suffix: string) {
    if (this.openai === undefined) {
      return;
    }

    const { settings } = this.plugin;
    const completions = await this.openai.completions.create({
      prompt: `Continue the following code written in ${language} language:\n\n${prefix}`,
      suffix,
      model: settings.completions.model,
      max_tokens: settings.completions.maxTokens,
      temperature: settings.completions.temperature,
      top_p: 1,
      n: 1,
      stop: ["\n\n\n"],
    });

    return completions.choices[0].text;
  }
}
