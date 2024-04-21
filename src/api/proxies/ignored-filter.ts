import { minimatch } from 'minimatch';
import { MarkdownView } from 'obsidian';
import Markpilot from 'src/main';
import { APIClient, ChatMessage } from '..';

export class IgnoredFilter implements APIClient {
  constructor(
    private client: APIClient,
    private plugin: Markpilot,
  ) {}

  fetchChat(messages: ChatMessage[]) {
    // No filter for chats.
    return this.client.fetchChat(messages);
  }

  async fetchCompletions(prefix: string, suffix: string) {
    const { plugin } = this;
    const { settings } = plugin;

    const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view?.file;
    const content = view?.editor.getValue();
    const isIgnoredFile = settings.completions.ignoredFiles.some(
      (pattern) => file?.path && minimatch(file?.path, pattern),
    );
    const hasIgnoredTags = settings.completions.ignoredTags.some(
      (tag) => content && new RegExp(tag, 'gm').test(content),
    );
    if (isIgnoredFile || hasIgnoredTags) {
      return;
    }

    return this.client.fetchCompletions(prefix, suffix);
  }

  testConnection() {
    return this.client.testConnection();
  }
}
