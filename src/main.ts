import { Extension } from '@codemirror/state';
import { Notice, Plugin } from 'obsidian';
import { MemoryCache } from './api/cache';
import { APIClient, OpenAIClient } from './api/openai';
import { CHAT_VIEW_TYPE, ChatView } from './chat/view';
import { inlineCompletionsExtension } from './editor/extension';
import {
  DEFAULT_SETTINGS,
  MarkpilotSettings,
  MarkpilotSettingTab,
} from './settings';

export default class Markpilot extends Plugin {
  client: APIClient;
  settings: MarkpilotSettings;
  view: ChatView;
  extensions: Extension[];

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MarkpilotSettingTab(this.app, this));

    const client = new OpenAIClient(this);
    const cache = new MemoryCache(client, this);
    this.client = cache;
    this.extensions = this.getEditorExtension();
    this.registerEditorExtension(this.extensions);
    this.registerView(CHAT_VIEW_TYPE, (leaf) => {
      this.view = new ChatView(leaf, this);
      return this.view;
    });
    if (this.settings.chat.enabled) {
      this.activateView();
    }

    if (
      (this.settings.completions.enabled || this.settings.chat.enabled) &&
      !this.settings.apiKey?.startsWith('sk')
    ) {
      new Notice(
        'OpenAI API key is not set. Please register it in the settings tab to use the features.',
      );
    }

    this.addCommand({
      id: 'enable-completions',
      name: 'Enable inline completions',
      callback: () => {
        this.settings.completions.enabled = true;
        this.saveSettings();
        new Notice('Inline completions enabled.');
      },
    });
    this.addCommand({
      id: 'disable-completions',
      name: 'Disable inline completions',
      callback: () => {
        this.settings.completions.enabled = false;
        this.saveSettings();
        new Notice('Inline completions disabled.');
      },
    });
    this.addCommand({
      id: 'enable-chat-view',
      name: 'Enable chat view',
      callback: () => {
        this.settings.chat.enabled = true;
        this.saveSettings();
        this.activateView();
        new Notice('Chat view enabled.');
      },
    });
    this.addCommand({
      id: 'disable-chat-view',
      name: 'Disable chat view',
      callback: () => {
        this.settings.chat.enabled = false;
        this.saveSettings();
        this.deactivateView();
        new Notice('Chat view disabled.');
      },
    });
    this.addCommand({
      id: 'clear-chat-history',
      name: 'Clear chat history',
      callback: () => {
        this.settings.chat.history = {
          messages: [],
          response: '',
        };
        this.saveSettings();
        this.view.clear?.();
        new Notice('Chat history cleared.');
      },
    });
    this.addCommand({
      id: 'enable-cache',
      name: 'Enable cache',
      callback: () => {
        this.settings.cache.enabled = true;
        this.saveSettings();
        new Notice('Cache enabled.');
      },
    });
    this.addCommand({
      id: 'disable-cache',
      name: 'Disable cache',
      callback: () => {
        this.settings.cache.enabled = false;
        this.saveSettings();
        new Notice('Cache disabled.');
      },
    });
  }

  getEditorExtension() {
    return inlineCompletionsExtension(async (...args) => {
      if (this.settings.completions.enabled) {
        return this.client.fetchCompletions(...args);
      }
    }, this);
  }

  updateEditorExtension() {
    const { workspace } = this.app;

    this.extensions.splice(
      0,
      this.extensions.length,
      ...this.getEditorExtension(),
    );
    workspace.updateOptions();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;

    const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
    if (leaves.length > 0) {
      return;
    }

    const newLeaf = workspace.getRightLeaf(false);
    await newLeaf?.setViewState({ type: CHAT_VIEW_TYPE, active: true });
  }

  async deactivateView() {
    const { workspace } = this.app;

    const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
    for (const leaf of leaves) {
      leaf.detach();
    }
  }
}
