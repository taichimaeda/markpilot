import { getEncoding } from 'js-tiktoken';
import { Notice } from 'obsidian';
import OpenAI from 'openai';
import Markpilot from 'src/main';
import { APIClient } from '..';
import { ChatMessage } from '../../types';
import { CostsTracker } from '../costs';
import { PromptGenerator } from '../prompts/generator';

export abstract class OpenAICompatibleAPIClient implements APIClient {
  constructor(
    protected generator: PromptGenerator,
    protected tracker: CostsTracker,
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

  async fetchCompletions(prefix: string, suffix: string) {
    const { settings } = this.plugin;

    if (this.openai === undefined) {
      return;
    }

    try {
      const messages = this.generator.generate(prefix, suffix);
      const completions = await this.openai.chat.completions.create({
        messages,
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

      const content = completions.choices[0].message.content;
      if (content === null) {
        return;
      }
      return this.generator.parse(content);
    } catch (error) {
      console.error(error);
      new Notice(
        'Failed to fetch completions.  Make sure your API key or API URL is correct.',
      );
    }
  }
}
