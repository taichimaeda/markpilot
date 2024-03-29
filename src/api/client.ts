import OpenAI from "openai";
import Markpilot from "src/main";

export type ChatRole = "system" | "assistant" | "user";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  response: string;
}

export class OpenAIClient {
  private openai: OpenAI;

  constructor(private plugin: Markpilot) {
    const apiKey = this.plugin.settings.apiKey ?? "";
    this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  protected get client() {
    const apiKey = this.plugin.settings.apiKey;
    if (apiKey === undefined) {
      return undefined;
    }
    this.openai.apiKey = apiKey;
    return this.openai;
  }

  async *fetchChat(messages: ChatMessage[]) {
    if (this.client === undefined) {
      return;
    }

    const stream = await this.client.chat.completions.create({
      messages: [
        // {
        //   role: "system",
        //   content: defaultPrompt,
        // },
        ...messages,
      ],
      model: "gpt-3.5-turbo",
      stream: true,
      max_tokens: 4096,
      temperature: 0.1,
      top_p: 1,
      n: 1,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0].delta.content ?? "";
      yield content;
    }
  }

  async fetchCompletions(language: string, prefix: string, suffix: string) {
    if (this.client === undefined) {
      return;
    }

    const completions = await this.client.completions.create({
      prompt: `Continue the following ${language} code:\n\n${prefix}`,
      suffix,
      model: "gpt-3.5-turbo-instruct",
      max_tokens: 100,
      temperature: 0,
      top_p: 1,
      n: 1,
      stop: ["\n\n\n"],
    });

    return completions.choices[0].text;
  }
}
