import { Plugin } from "obsidian";
import { ChatHistory, OpenAIClient } from "./api/client";
import { CHAT_VIEW_TYPE, ChatView } from "./chat/view";
import { inlineCompletionExtension } from "./editor/extension";
import { MarkpilotSettingTab } from "./settings";

interface MarkpilotSettings {
  apiKey: string | undefined;
  chatHistory: ChatHistory;
  enableCompletion: boolean;
  enableChat: boolean;
}

const DEFAULT_SETTINGS: MarkpilotSettings = {
  apiKey: undefined,
  chatHistory: {
    messages: [],
    response: "",
  },
  enableCompletion: true,
  enableChat: true,
};

export default class Markpilot extends Plugin {
  settings: MarkpilotSettings;
  client: OpenAIClient;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MarkpilotSettingTab(this.app, this));

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

    this.addCommand({
      id: "markpilot-enable-completions",
      name: "Enable inline completions",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.enableCompletion = true;
        this.saveSettings();
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
        this.settings.enableCompletion = false;
        this.saveSettings();
        return true;
      },
    });
    this.addCommand({
      id: "markpilot-enable-chat",
      name: "Enable chat",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.enableChat = true;
        this.saveSettings();
        this.activateView();
        return true;
      },
    });
    this.addCommand({
      id: "markpilot-disable-chat",
      name: "Disable chat",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.enableChat = false;
        this.saveSettings();
        this.deactivateView();
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
        this.settings.chatHistory = {
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
