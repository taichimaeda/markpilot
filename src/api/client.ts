import { getEncoding } from 'js-tiktoken';
import { Notice } from 'obsidian';
import OpenAI from 'openai';
import Markpilot from 'src/main';
import { validateURL } from 'src/utils';
import { ChatMessage } from './types';
import { UsageTracker } from './usage';

export interface APIClient {
  fetchChat(messages: ChatMessage[]): AsyncGenerator<string | undefined>;
  fetchCompletions(
    language: string,
    prefix: string,
    suffix: string,
  ): Promise<string | undefined>;
}

abstract class OpenAICompatibleAPIClient implements APIClient {
  constructor(
    protected tracker: UsageTracker,
    protected plugin: Markpilot,
  ) {}

  abstract get openai(): OpenAI | undefined;

  async *fetchChat(messages: ChatMessage[]) {
    const { settings } = this.plugin;

    if (this.openai === undefined) {
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
      await this.tracker.add(
        settings.chat.provider,
        settings.chat.model,
        inputTokens,
        outputTokens,
      );
    } catch (error) {
      console.error(error);
      new Notice(
        'Failed to fetch chat completions. Make sure your API key or API URL is correct.',
      );
    }
  }

  async fetchCompletions(language: string, prefix: string, suffix: string) {
    const { settings } = this.plugin;

    if (this.openai === undefined) {
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
      await this.tracker.add(
        settings.completions.provider,
        settings.completions.model,
        inputTokens,
        outputTokens,
      );

      return completions.choices[0].text;
    } catch (error) {
      console.error(error);
      new Notice(
        'Failed to fetch completions.  Make sure your API key or API URL is correct.',
      );
    }
  }
}

export class OpenAIAPIClient
  extends OpenAICompatibleAPIClient
  implements APIClient
{
  constructor(tracker: UsageTracker, plugin: Markpilot) {
    super(tracker, plugin);
  }

  get openai(): OpenAI | undefined {
    const { settings } = this.plugin;

    const apiKey = settings.providers.openai.apiKey;
    if (apiKey === undefined) {
      new Notice('OpenAI API key is not set.');
      return;
    }
    if (!apiKey.startsWith('sk')) {
      new Notice('OpenAI API key is invalid.');
      return;
    }

    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
}

export class OpenRouterAPIClient
  extends OpenAICompatibleAPIClient
  implements APIClient
{
  constructor(tracker: UsageTracker, plugin: Markpilot) {
    super(tracker, plugin);
  }

  get openai(): OpenAI | undefined {
    const { settings } = this.plugin;

    const apiKey = settings.providers.openrouter.apiKey;
    if (apiKey === undefined) {
      new Notice('OpenRouter API key is not set.');
      return;
    }
    if (!apiKey.startsWith('sk')) {
      new Notice('OpenRouter API key is invalid.');
      return;
    }

    return new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true,
    });
  }
}

export class OllamaAPIClient
  extends OpenAICompatibleAPIClient
  implements APIClient
{
  constructor(tracker: UsageTracker, plugin: Markpilot) {
    super(tracker, plugin);
  }

  get openai(): OpenAI | undefined {
    const { settings } = this.plugin;

    const apiUrl = settings.providers.ollama.apiUrl;
    if (apiUrl === undefined) {
      new Notice('Ollama API URL is not set.');
      return;
    }
    if (!validateURL(apiUrl)) {
      new Notice('Ollama API URL is invalid.');
      return;
    }

    return new OpenAI({
      baseURL: apiUrl,
      dangerouslyAllowBrowser: true,
    });
  }
}

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
