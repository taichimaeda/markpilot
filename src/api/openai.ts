import { getEncoding } from 'js-tiktoken';
import { Notice } from 'obsidian';
import OpenAI from 'openai';
import Markpilot from 'src/main';
import { getThisMonthAsString, getTodayAsString } from 'src/utils';

export const COMPLETIONS_MODELS = [
  'gpt-3.5-turbo-instruct',
  'davinci-002',
  'babbage-002',
] as const;

export const CHAT_COMPLETIONS_MODELS = [
  'gpt-4-0125-preview',
  'gpt-4-turbo-preview',
  'gpt-4-1106-preview',
  'gpt-4-vision-preview',
  'gpt-4',
  'gpt-4-0314',
  'gpt-4-0613',
  'gpt-4-32k',
  'gpt-4-32k-0314',
  'gpt-4-32k-0613',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-3.5-turbo-0301',
  'gpt-3.5-turbo-0613',
  'gpt-3.5-turbo-1106',
  'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo-16k-0613',
] as const;

export const MODEL_INPUT_COSTS: Record<
  | (typeof COMPLETIONS_MODELS)[number]
  | (typeof CHAT_COMPLETIONS_MODELS)[number],
  number
> = {
  'gpt-3.5-turbo-instruct': 1.5,
  'davinci-002': 12.0,
  'babbage-002': 1.6,
  'gpt-4-0125-preview': 10.0,
  'gpt-4-turbo-preview': 10.0,
  'gpt-4-1106-preview': 10.0,
  'gpt-4-vision-preview': 10.0,
  'gpt-4': 30.0,
  'gpt-4-0314': 30.0,
  'gpt-4-0613': 30.0,
  'gpt-4-32k': 60.0,
  'gpt-4-32k-0314': 60.0,
  'gpt-4-32k-0613': 60.0,
  'gpt-3.5-turbo': 0.5,
  'gpt-3.5-turbo-16k': 0.5,
  'gpt-3.5-turbo-0301': 0.5,
  'gpt-3.5-turbo-0613': 0.5,
  'gpt-3.5-turbo-1106': 0.5,
  'gpt-3.5-turbo-0125': 0.5,
  'gpt-3.5-turbo-16k-0613': 0.5,
} as const;

export const MODEL_OUTPUT_COSTS: Record<
  | (typeof COMPLETIONS_MODELS)[number]
  | (typeof CHAT_COMPLETIONS_MODELS)[number],
  number
> = {
  'gpt-3.5-turbo-instruct': 2.0,
  'davinci-002': 12.0,
  'babbage-002': 1.6,
  'gpt-4-0125-preview': 30,
  'gpt-4-turbo-preview': 30,
  'gpt-4-1106-preview': 30,
  'gpt-4-vision-preview': 30,
  'gpt-4': 60,
  'gpt-4-0314': 60,
  'gpt-4-0613': 60,
  'gpt-4-32k': 120,
  'gpt-4-32k-0314': 120,
  'gpt-4-32k-0613': 120,
  'gpt-3.5-turbo': 1.5,
  'gpt-3.5-turbo-16k': 1.5,
  'gpt-3.5-turbo-0301': 1.5,
  'gpt-3.5-turbo-0613': 1.5,
  'gpt-3.5-turbo-1106': 1.5,
  'gpt-3.5-turbo-0125': 1.5,
  'gpt-3.5-turbo-16k-0613': 1.5,
};

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

export class OpenAIClient implements APIClient {
  constructor(private plugin: Markpilot) {}

  get openai() {
    const apiKey = this.plugin.settings.apiKey ?? '';
    return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  async *fetchChat(messages: ChatMessage[]) {
    if (this.openai === undefined) {
      return;
    }

    const { settings } = this.plugin;

    const thisMonth = getThisMonthAsString();
    if (settings.usage.monthlyCosts[thisMonth] >= settings.usage.monthlyLimit) {
      new Notice(
        'Monthly usage limit reached. Please increase the limit to keep on using the features.',
      );
      return;
    }

    try {
      const stream = await this.openai.chat.completions.create({
        messages,
        model: settings.chat.model,
        max_tokens: settings.chat.maxTokens,
        temperature: settings.chat.temperature,
        top_p: 1,
        n: 1,
        stream: true,
      });

      const contents = [];
      for await (const chunk of stream) {
        const content = chunk.choices[0].delta.content ?? '';
        contents.push(content);
        yield content;
      }

      // Update usage cost estimates.
      const enc = getEncoding('gpt2'); // Assume GPT-2 encoding
      const inputMessage = messages
        .map((message) => message.content)
        .join('\n');
      const outputMessage = contents.join('');
      const inputTokens = enc.encode(inputMessage).length;
      const outputTokens = enc.encode(outputMessage).length;
      await this.updateUsage(settings.chat.model, inputTokens, outputTokens);
    } catch (error) {
      console.error(error);
      new Notice('Failed to fetch chat completions.');
    }
  }

  async fetchCompletions(language: string, prefix: string, suffix: string) {
    if (this.openai === undefined) {
      return;
    }

    const { settings } = this.plugin;

    const thisMonth = getThisMonthAsString();
    if (settings.usage.monthlyCosts[thisMonth] >= settings.usage.monthlyLimit) {
      new Notice(
        'Monthly usage limit reached. Please increase the limit to keep on using the features.',
      );
      return;
    }

    try {
      const completions = await this.openai.completions.create({
        prompt: `Continue the following code written in ${language} language:\n\n${prefix}`,
        suffix,
        model: settings.completions.model,
        max_tokens: settings.completions.maxTokens,
        temperature: settings.completions.temperature,
        top_p: 1,
        n: 1,
        stop: ['\n\n\n'],
      });

      // Update usage cost estimates.
      const inputTokens = completions.usage?.prompt_tokens ?? 0;
      const outputTokens = completions.usage?.completion_tokens ?? 0;
      await this.updateUsage(
        settings.completions.model,
        inputTokens,
        outputTokens,
      );

      return completions.choices[0].text;
    } catch (error) {
      console.error(error);
      new Notice('Failed to fetch completions.');
    }
  }

  async updateUsage(
    model: CompletionsModel | ChatCompletionsModel,
    inputTokens: number,
    outputTokens: number,
  ) {
    const { settings } = this.plugin;
    const today = getTodayAsString();
    const thisMonth = getThisMonthAsString();
    if (settings.usage.dailyCosts[today] === undefined) {
      settings.usage.dailyCosts[today] = 0;
    }
    const cost =
      (inputTokens * MODEL_INPUT_COSTS[model] +
        outputTokens * MODEL_OUTPUT_COSTS[model]) /
      1_000_000;
    settings.usage.dailyCosts[today] += cost;
    settings.usage.monthlyCosts[thisMonth] += cost;

    await this.plugin.saveSettings();
  }
}
