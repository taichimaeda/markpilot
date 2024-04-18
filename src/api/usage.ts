import { Notice } from 'obsidian';
import Markpilot from 'src/main';
import { getThisMonthAsString, getTodayAsString } from 'src/utils';
import { APIClient } from './client';
import {
  Model,
  OllamaModel,
  OpenAIModel,
  OpenRouterModel,
  Provider,
} from './provider';
import { ChatMessage } from './types';

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

// TODO
const OPENROUTER_INPUT_COSTS: Record<OpenRouterModel, number> = {
  'gpt-4': 30,
};

// TODO
const OPENROUTER_OUTPUT_COSTS: Record<OpenRouterModel, number> = {
  'gpt-4': 60,
};

// TODO
const OLLAMA_INPUT_COSTS: Record<OllamaModel, number> = {
  'gpt-4': 0,
};

// TODO
const OLLAMA_OUTPUT_COSTS: Record<OllamaModel, number> = {
  'gpt-4': 0,
};

const INPUT_COSTS: Record<Provider, Record<Model, number>> = {
  openai: OPENAI_MODEL_INPUT_COSTS,
  openrouter: OPENROUTER_INPUT_COSTS,
  ollama: OLLAMA_INPUT_COSTS,
};

const OUTPUT_COSTS: Record<Provider, Record<Model, number>> = {
  openai: OPENAI_MODEL_OUTPUT_COSTS,
  openrouter: OPENROUTER_OUTPUT_COSTS,
  ollama: OLLAMA_OUTPUT_COSTS,
};

export class UsageTracker {
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
      (inputTokens * INPUT_COSTS[provider][model] +
        outputTokens * OUTPUT_COSTS[provider][model]) /
      1_000_000;

    settings.usage.dailyCosts[today] += cost;
    settings.usage.monthlyCosts[thisMonth] += cost;

    await this.plugin.saveSettings();
  }
}

export class UsageMonitorProxy implements APIClient {
  constructor(
    private client: APIClient,
    private plugin: Markpilot,
  ) {}

  hasReachedLimit() {
    const { settings } = this.plugin;

    const thisMonth = getThisMonthAsString();
    return (
      settings.usage.monthlyCosts[thisMonth] >= settings.usage.monthlyLimit
    );
  }

  async *fetchChat(messages: ChatMessage[]) {
    if (this.hasReachedLimit()) {
      new Notice(
        'Monthly usage limit reached. Please increase the limit to keep on using inline completions.',
      );
      return;
    }

    yield* this.client.fetchChat(messages);
  }

  async fetchCompletions(language: string, prefix: string, suffix: string) {
    if (this.hasReachedLimit()) {
      new Notice(
        'Monthly usage limit reached. Please increase the limit to keep on using chat view.',
      );
      return;
    }

    return await this.client.fetchCompletions(language, prefix, suffix);
  }
}
