import { Extension } from '@codemirror/state';
import { minimatch } from 'minimatch';
import {
  addIcon,
  MarkdownView,
  Notice,
  Plugin,
  setIcon,
  WorkspaceLeaf,
} from 'obsidian';
import { APIClient, ChatMessage } from './api';
import { OllamaAPIClient } from './api/clients/ollama';
import { OpenAIAPIClient } from './api/clients/openai';
import { OpenRouterAPIClient } from './api/clients/openrouter';
import { PromptGenerator } from './api/prompts/generator';
import { Provider } from './api/providers';
import { CostsTracker } from './api/providers/costs';
import { MemoryCacheProxy } from './api/proxies/memory-cache';
import { UsageMonitorProxy } from './api/proxies/usage-monitor';
import { CHAT_VIEW_TYPE, ChatView } from './chat/view';
import { inlineCompletionsExtension } from './editor/extension';
import botOffIcon from './icons/bot-off.svg';
import {
  DEFAULT_SETTINGS,
  MarkpilotSettings,
  MarkpilotSettingTab,
} from './settings';
import { SettingsMigrationsRunner } from './settings/runner';
import { debounceAsyncFunc, debounceAsyncGenerator } from './utils';

export default class Markpilot extends Plugin {
  settings: MarkpilotSettings;

  extensions: Extension[];
  completionsClient: APIClient;
  chatClient: APIClient;
  chatView: ChatView;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MarkpilotSettingTab(this.app, this));

    const { settings } = this;
    this.completionsClient = this.createAPIClient(
      settings.completions.provider,
    );
    this.chatClient = this.createAPIClient(settings.chat.provider);

    this.extensions = this.createEditorExtension();
    this.registerEditorExtension(this.extensions);
    this.registerView(CHAT_VIEW_TYPE, (leaf) => {
      this.chatView = this.createChatView(leaf);
      return this.chatView;
    });

    this.registerCustomIcons(); // Call before `registerRibbonActions()`.
    this.registerRibbonActions();
    this.registerCommands();
  }

  registerCustomIcons() {
    addIcon('bot-off', botOffIcon);
  }

  registerRibbonActions() {
    const { settings } = this;

    const toggleCompletionsItem = this.addRibbonIcon(
      settings.completions.enabled ? 'bot' : 'bot-off',
      'Toggle inline completions',
      () => {
        this.settings.completions.enabled = !this.settings.completions.enabled;
        this.saveSettings();
        setIcon(
          toggleCompletionsItem,
          this.settings.completions.enabled ? 'bot' : 'bot-off',
        );
        new Notice(
          `Inline completions ${this.settings.completions.enabled ? 'enabled' : 'disabled'}.`,
        );
      },
    );
  }

  registerCommands() {
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
      id: 'toggle-completions',
      name: 'Toggle inline completions',
      callback: () => {
        this.settings.completions.enabled = !this.settings.completions.enabled;
        this.saveSettings();
        new Notice(
          `Inline completions ${this.settings.completions.enabled ? 'enabled' : 'disabled'}.`,
        );
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
      id: 'toggle-chat-view',
      name: 'Toggle chat view',
      callback: () => {
        this.settings.chat.enabled = !this.settings.chat.enabled;
        this.saveSettings();
        this.deactivateView();
        new Notice(
          `Chat view ${this.settings.completions.enabled ? 'enabled' : 'disabled'}.`,
        );
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
        this.chatView.clear?.();
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

    this.addCommand({
      id: 'toggle-cache',
      name: 'Toggle cache',
      callback: () => {
        this.settings.cache.enabled = !this.settings.cache.enabled;
        this.saveSettings();
        new Notice(
          `Cache ${this.settings.completions.enabled ? 'enabled' : 'disabled'}.`,
        );
      },
    });
  }

  createAPIClient(provider: Provider) {
    const generator = new PromptGenerator(this);
    const tracker = new CostsTracker(this);
    const client = (() => {
      switch (provider) {
        case 'openai':
          return new OpenAIAPIClient(generator, tracker, this);
        case 'openrouter':
          return new OpenRouterAPIClient(generator, tracker, this);
        case 'ollama':
          return new OllamaAPIClient(generator, tracker, this);
      }
    })();
    const clientWithMonitor = new UsageMonitorProxy(client, this);
    const clientWithCache = new MemoryCacheProxy(clientWithMonitor, this);

    return clientWithCache;
  }

  updateAPIClient() {
    const { settings } = this;

    this.chatClient = this.createAPIClient(settings.chat.provider);
    this.completionsClient = this.createAPIClient(
      settings.completions.provider,
    );
  }

  createEditorExtension() {
    const { settings } = this;

    const fetcher = async (prefix: string, suffix: string) => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      const file = view?.file;
      const content = view?.editor.getValue();
      const isIgnoredFile = this.settings.completions.ignoredFiles.some(
        (pattern) => file?.path && minimatch(file?.path, pattern),
      );
      const hasIgnoredTags = this.settings.completions.ignoredTags.some((tag) =>
        content?.includes(tag),
      );
      if (
        isIgnoredFile ||
        hasIgnoredTags ||
        !this.settings.completions.enabled
      ) {
        return;
      }
      return this.completionsClient.fetchCompletions(prefix, suffix);
    };

    const { debounced, cancel, force } = debounceAsyncFunc(
      fetcher,
      settings.completions.waitTime,
    );

    return inlineCompletionsExtension(debounced, cancel, force, this);
  }

  updateEditorExtension() {
    const { workspace } = this.app;

    // Clear the existing extensions and insert new ones,
    // keeping the reference to the same array.
    this.extensions.splice(
      0,
      this.extensions.length,
      ...this.createEditorExtension(),
    );
    workspace.updateOptions();
  }

  createChatView(leaf: WorkspaceLeaf) {
    const fetcher = (messages: ChatMessage[]) => {
      return this.chatClient.fetchChat(messages);
    };
    const { debounced, cancel } = debounceAsyncGenerator(fetcher, 0);

    const view = new ChatView(leaf, debounced, cancel, this);
    if (this.settings.chat.enabled) {
      this.activateView();
    }
    return view;
  }

  updateChatView() {
    // TODO:
    // This does not fully update the chat view.
    // For example if anything becomes stale in the fetcher closure, it will not be updated.
    if (this.settings.chat.enabled) {
      this.activateView();
    } else {
      this.deactivateView();
    }
  }

  async loadSettings() {
    const data = await this.loadData();
    if (data === null) {
      this.settings = DEFAULT_SETTINGS;
      return;
    }

    this.settings = data;
    const runner = new SettingsMigrationsRunner(this);
    await runner.apply();
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
