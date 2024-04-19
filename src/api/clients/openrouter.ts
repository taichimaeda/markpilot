import { Notice } from 'obsidian';
import OpenAI from 'openai';
import Markpilot from 'src/main';
import { APIClient } from '../client';
import { CostsTracker } from '../costs';
import { OpenAICompatibleAPIClient } from './openai-compatible';

export class OpenRouterAPIClient
  extends OpenAICompatibleAPIClient
  implements APIClient
{
  constructor(tracker: CostsTracker, plugin: Markpilot) {
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