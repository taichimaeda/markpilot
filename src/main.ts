import { Notice, Plugin } from "obsidian";
import { RedisCache } from "./api/cache";
import { APIClient, OpenAIClient } from "./api/openai";
import { CHAT_VIEW_TYPE, ChatView } from "./chat/view";
import { inlineCompletionExtension } from "./editor/extension";
import {
  DEFAULT_SETTINGS,
  MarkpilotSettings,
  MarkpilotSettingTab,
} from "./settings";

export default class Markpilot extends Plugin {
  settings: MarkpilotSettings;
  client: APIClient;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MarkpilotSettingTab(this.app, this));

    const client = new OpenAIClient(this);
    const cache = new RedisCache(client, this);
    this.client = cache;
    this.client.initialize();

    const fetcher = async (
      language: string,
      prefix: string,
      suffix: string
    ) => {
      if (this.settings.completions.enabled) {
        return this.client.fetchCompletions(language, prefix, suffix);
      }
    };
    this.registerEditorExtension(inlineCompletionExtension(fetcher, this));
    this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this));
    if (this.settings.chat.enabled) {
      this.activateView();
    }

    this.addCommand({
      id: "markpilot-enable-completions",
      name: "Enable inline completions",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.completions.enabled = true;
        this.saveSettings();
        new Notice("Inline completions enabled.");
        return true;
      },
    });
    this.addCommand({
      id: "markpilot-disable-completions",
      name: "Disable inline completions",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.completions.enabled = false;
        this.saveSettings();
        new Notice("Inline completions disabled.");
        return true;
      },
    });
    this.addCommand({
      id: "markpilot-enable-chat-view",
      name: "Enable chat view",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.chat.enabled = true;
        this.saveSettings();
        this.activateView();
        new Notice("Chat view enabled.");
        return true;
      },
    });
    this.addCommand({
      id: "markpilot-disable-chat-view",
      name: "Disable chat view",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.chat.enabled = false;
        this.saveSettings();
        this.deactivateView();
        new Notice("Chat view disabled.");
        return true;
      },
    });
    this.addCommand({
      id: "markpilot-clear-chat-history",
      name: "Clear chat history",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.chat.history = {
          messages: [],
          response: "",
        };
        this.saveSettings();
        this.deactivateView();
        this.activateView();
        return true;
      },
    });
  }

  onunload() {
    this.client.destroy();
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
