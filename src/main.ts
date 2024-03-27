import { Plugin } from "obsidian";
import { OpenAIClient } from "./api/client";
import { CHAT_VIEW_TYPE, ChatView } from "./chat/view";
import { inlineCompletionExtension } from "./editor/extension";
import { ObsidianCopilotSettingTab } from "./settings";

interface ObsidianCopilotSettings {
  apiKey: string | undefined;
  enableCompletion: boolean;
  enableChat: boolean;
}

const DEFAULT_SETTINGS: ObsidianCopilotSettings = {
  apiKey: undefined,
  enableCompletion: true,
  enableChat: true,
};

export default class ObsidianCopilot extends Plugin {
  settings: ObsidianCopilotSettings;
  client: OpenAIClient;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ObsidianCopilotSettingTab(this.app, this));

    this.client = new OpenAIClient(this);

    const fetcher = async (
      language: string,
      prefix: string,
      suffix: string
    ) => {
      if (this.settings.enableCompletion) {
        return this.client.fetchCompletions(language, prefix, suffix);
      }
    };
    this.registerEditorExtension(inlineCompletionExtension(fetcher));
    this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this));
    if (this.settings.enableChat) {
      this.activateView();
    }
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
