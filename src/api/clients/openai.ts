import { Notice } from 'obsidian';
import OpenAI from 'openai';
import Markpilot from 'src/main';
import { APIClient } from '..';
import { PromptGenerator } from '../prompts/generator';
import { CostsTracker } from '../providers/costs';
import { OpenAICompatibleAPIClient } from './openai-compatible';

export class OpenAIAPIClient
  extends OpenAICompatibleAPIClient
  implements APIClient
{
  constructor(
    generator: PromptGenerator,
    tracker: CostsTracker,
    plugin: Markpilot,
  ) {
    super(generator, tracker, plugin);
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
