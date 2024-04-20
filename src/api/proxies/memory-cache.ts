import { createHash } from 'crypto';
import Markpilot from 'src/main';
import { APIClient, ChatMessage } from '..';

export class MemoryCacheProxy implements APIClient {
  private store: Map<string, string> = new Map();

  constructor(
    private client: APIClient,
    private plugin: Markpilot,
  ) {}

  fetchChat(messages: ChatMessage[]) {
    // No caching for chats.
    return this.client.fetchChat(messages);
  }

  async fetchCompletions(prefix: string, suffix: string) {
    const { settings } = this.plugin;

    if (!settings.cache.enabled) {
      const completions = await this.client.fetchCompletions(prefix, suffix);
      return completions;
    }

    // Use half the window size
    // because some characters may have overflowed due to extra whitespaces.
    const windowSize = settings.completions.windowSize / 2;
    const truncatedPrefix = prefix.slice(
      prefix.length - windowSize / 2,
      prefix.length,
    );
    const truncatedSuffix = suffix.slice(0, windowSize / 2);

    // Extra whitespaces should not affect the completions.
    // We remove them after truncating the prefix and suffix for efficiency.
    const compactPrefix = truncatedPrefix.replace(/\s\s+/g, ' ');
    const compactSuffix = truncatedSuffix.replace(/\s\s+/g, ' ');

    const hash = createHash('sha256')
      .update(`${compactPrefix} ${compactSuffix} `, 'utf8')
      .digest('hex');

    if (await this.store.has(hash)) {
      const cache = await this.store.get(hash);
      return cache;
    }

    const completions = await this.client.fetchCompletions(prefix, suffix);
    if (completions === undefined) {
      return undefined;
    }
    await this.store.set(hash, completions);
    return completions;
  }

  testConnection() {
    return this.client.testConnection();
  }
}
