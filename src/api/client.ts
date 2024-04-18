import { getEncoding } from 'js-tiktoken';
import { Notice } from 'obsidian';
import OpenAI, { ClientOptions } from 'openai';
import Markpilot from 'src/main';
import { Provider } from './provider';
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

// TODO:
// Allow use of APIs that are not compatible with the OpenAI API standard.
export class BaseAPIClient implements APIClient {
  constructor(
    private tracker: UsageTracker,
    private plugin: Markpilot,
  ) {}

  getInstance(provider: Provider) {
    const { settings } = this.plugin;

    const options: ClientOptions = {
      apiKey: undefined,
      baseURL: undefined,
      dangerouslyAllowBrowser: true,
    };
    switch (provider) {
      case 'openai':
        options.apiKey = settings.providers.openai.apiKey;
        if (options.apiKey === undefined || !options.apiKey?.startsWith('sk')) {
          new Notice('OpenAI API key is not set or invalid.');
          return;
        }
        break;
      case 'openrouter':
        options.baseURL = 'https://openrouter.ai/api/v1';
        options.apiKey = settings.providers.openrouter.apiKey;
        if (options.apiKey === undefined || !options.apiKey?.startsWith('sk')) {
          new Notice('OpenRouter API key is not set or invalid.');
          return;
        }
        break;
      case 'ollama':
        options.baseURL = 'http://localhost:11434/v1/';
        options.baseURL = settings.providers.ollama.apiUrl;
        if (options.apiKey === undefined) {
          new Notice('Ollama API URL is not set or invalid.');
          return;
        }
        break;
      default:
        throw new Error('Invalid API provider.');
    }

    return new OpenAI(options);
  }

  async *fetchChat(messages: ChatMessage[]) {
    const { settings } = this.plugin;

    const instance = this.getInstance(settings.chat.provider);
    if (instance === undefined) {
      return;
    }

    try {
      const stream = await instance.chat.completions.create({
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

    const instance = this.getInstance(settings.completions.provider);
    if (instance === undefined) {
      return;
    }

    try {
      const completions = await instance.completions.create({
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
