import Markpilot from 'src/main';
import { getThisMonthAsString, getTodayAsString } from 'src/utils';
import { Provider } from '.';
import { Model } from './models';
import OllamaModelsJSON from './ollama.json';
import OpenAIModelsJSON from './openai.json';
import OpenRouterModelsJSON from './openrouter.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ModelsJSON: Record<Provider, any> = {
  ollama: OllamaModelsJSON,
  openrouter: OpenRouterModelsJSON,
  openai: OpenAIModelsJSON,
};

export class CostsTracker {
  constructor(private plugin: Markpilot) {}

  async add(
    provider: Provider,
    model: Model | Model,
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
      (inputTokens * ModelsJSON[provider][model].inputCost +
        outputTokens * ModelsJSON[provider][model].outputCost) /
      // Costs are stored in per 1M token.
      1_000_000;

    settings.usage.dailyCosts[today] += cost;
    settings.usage.monthlyCosts[thisMonth] += cost;

    // TODO:
    // Only save settings before unload.
    await this.plugin.saveSettings();
  }
}
