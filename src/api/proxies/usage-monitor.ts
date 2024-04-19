import { Notice } from 'obsidian';
import Markpilot from 'src/main';
import { getThisMonthAsString } from 'src/utils';
import { ChatMessage } from '../../types';
import { APIClient } from '../client';

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
