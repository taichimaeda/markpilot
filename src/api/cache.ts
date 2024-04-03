import { createHash } from 'crypto';
import Markpilot from 'src/main';
import { APIClient, ChatMessage } from './openai';

export class MemoryCache implements APIClient {
  private store: Map<string, string> = new Map();

  constructor(
    private client: APIClient,
    private plugin: Markpilot,
  ) {}

  fetchChat(messages: ChatMessage[]) {
    // No caching for chats.
    return this.client.fetchChat(messages);
  }

  async fetchCompletions(language: string, prefix: string, suffix: string) {
    const { settings } = this.plugin;
    if (!settings.cache.enabled) {
      return;
    }

    // Extra whitespaces should not affect the completions.
    const compactPrefix = prefix.replace(/\s\s+/g, ' ');
    const compactSuffix = suffix.replace(/\s\s+/g, ' ');

    // Use half the window size
    // because some characters may have overflowed due to extra whitespaces.
    const windowSize = settings.completions.windowSize / 2;
    const truncatedPrefix = compactPrefix.slice(
      compactPrefix.length - windowSize / 2,
      compactPrefix.length,
    );
    const truncatedSuffix = compactSuffix.slice(0, windowSize / 2);

    const hash = createHash('sha256')
      .update(`${language} ${truncatedPrefix} ${truncatedSuffix} `, 'utf8')
      .digest('hex');

    if (await this.store.has(hash)) {
      const cache = await this.store.get(hash);
      return cache as string;
    }

    const completions = await this.client.fetchCompletions(
      language,
      prefix,
      suffix,
    );
    if (completions === undefined) {
      return undefined;
    }
    await this.store.set(hash, completions);
    return completions;
  }
}
