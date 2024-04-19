import Markpilot from 'src/main';
import { getThisMonthAsString, getTodayAsString } from 'src/utils';
import { Model, OpenAIModel, OpenRouterModel } from './models';
import { OFFLINE_PROVIDERS, OnlineProvider, Provider } from './provider';

const OPENAI_MODEL_INPUT_COSTS: Record<OpenAIModel, number> = {
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

const OPENAI_MODEL_OUTPUT_COSTS: Record<OpenAIModel, number> = {
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

// TODO:
// This is a placeholder.
const OPENROUTER_INPUT_COSTS: Record<OpenRouterModel, number> = {
  'openai/gpt-3.5-turbo': 0,
  'openai/gpt-4-turbo': 0,
};

// TODO:
// This is a placeholder.
const OPENROUTER_OUTPUT_COSTS: Record<OpenRouterModel, number> = {
  'openai/gpt-3.5-turbo': 0,
  'openai/gpt-4-turbo': 0,
};

// TODO:
// Replace `Record<string, number>` to an appropriate type.
const INPUT_COSTS: Record<OnlineProvider, Record<string, number>> = {
  openai: OPENAI_MODEL_INPUT_COSTS,
  openrouter: OPENROUTER_INPUT_COSTS,
};

// TODO:
// Replace `Record<string, number>` to an appropriate type.
const OUTPUT_COSTS: Record<OnlineProvider, Record<string, number>> = {
  openai: OPENAI_MODEL_OUTPUT_COSTS,
  openrouter: OPENROUTER_OUTPUT_COSTS,
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

    // No costs associated with offline providers.
    if (provider in OFFLINE_PROVIDERS) {
      return;
    }

    const today = getTodayAsString();
    const thisMonth = getThisMonthAsString();
    if (settings.usage.dailyCosts[today] === undefined) {
      settings.usage.dailyCosts[today] = 0;
    }

    const cost =
      (inputTokens * INPUT_COSTS[provider as OnlineProvider][model] +
        outputTokens * OUTPUT_COSTS[provider as OnlineProvider][model]) /
      1_000_000;

    settings.usage.dailyCosts[today] += cost;
    settings.usage.monthlyCosts[thisMonth] += cost;

    await this.plugin.saveSettings();
  }
}
