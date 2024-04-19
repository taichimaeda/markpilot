import { Notice } from 'obsidian';
import OpenAI from 'openai';
import Markpilot from 'src/main';
import { validateURL } from 'src/utils';
import { APIClient } from '..';
import { CostsTracker } from '../costs';
import { OpenAICompatibleAPIClient } from './openai-compatible';

export class OllamaAPIClient
  extends OpenAICompatibleAPIClient
  implements APIClient
{
  constructor(tracker: CostsTracker, plugin: Markpilot) {
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
