import { Notice } from 'obsidian';
import OpenAI from 'openai';
import Markpilot from 'src/main';
import { validateURL } from 'src/utils';
import { APIClient } from '..';
import { PromptGenerator } from '../prompts/generator';
import { CostsTracker } from '../providers/costs';
import { OpenAICompatibleAPIClient } from './openai-compatible';

export class OllamaAPIClient
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
      apiKey: 'ollama', // Required but ignored.
      dangerouslyAllowBrowser: true,
    });
  }
}
