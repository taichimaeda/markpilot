import { App, PluginSettingTab, Setting } from "obsidian";
import {
  CHAT_COMPLETIONS_MODELS,
  ChatCompletionsModel,
  ChatHistory,
  COMPLETIONS_MODELS,
  CompletionsModel,
} from "./api/client";

import Markpilot from "./main";

export interface MarkpilotSettings {
  apiKey: string | undefined;
  completions: {
    enabled: boolean;
    model: CompletionsModel;
    maxTokens: number;
    temperature: number;
    windowSize: number;
    acceptKey: string;
    rejectKey: string;
  };
  chat: {
    enabled: boolean;
    model: ChatCompletionsModel;
    maxTokens: number;
    temperature: number;
    history: ChatHistory;
  };
}

export const DEFAULT_SETTINGS: MarkpilotSettings = {
  apiKey: undefined,
  completions: {
    enabled: true,
    model: "gpt-3.5-turbo-instruct",
    maxTokens: 64,
    temperature: 1,
    windowSize: 512,
    acceptKey: "Enter",
    rejectKey: "Escape",
  },
  chat: {
    enabled: true,
    model: "gpt-3.5-turbo",
    maxTokens: 1024,
    temperature: 0.1,
    history: {
      messages: [],
      response: "",
    },
  },
};

export class MarkpilotSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: Markpilot
  ) {
    super(app, plugin);
  }

  async display() {
    const { containerEl } = this;

    containerEl.empty();

    const { plugin } = this;
    const { settings } = plugin;

    containerEl.createEl("h2", { text: "OpenAI" });

    new Setting(containerEl)
      .setName("OpenAI API Key")
      .setDesc("Enter your OpenAI API key to enable features.")
      .addText((text) =>
        text.setValue(settings.apiKey ?? "").onChange(async (value) => {
          settings.apiKey = value;
          await plugin.saveSettings();
        })
      );

    containerEl.createEl("h2", { text: "Inline completions" });

    new Setting(containerEl)
      .setName("Enable inline completion")
      .setDesc("Turn this on to enable inline completion.")
      .addToggle((toggle) =>
        toggle
          .setValue(settings.completions.enabled)
          .onChange(async (value) => {
            settings.completions.enabled = value;
            await plugin.saveSettings();
            this.display(); // Re-render settings tab
          })
      );
    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName("Model")
      .setDesc("Select the model for inline completions.")
      .addDropdown((dropdown) => {
        for (const option of COMPLETIONS_MODELS) {
          dropdown.addOption(option, option);
        }
        dropdown.setValue(settings.completions.model);
        dropdown.onChange(async (value) => {
          settings.completions.model = value as CompletionsModel;
          await plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName("Max tokens")
      .setDesc("Set the max tokens for inline completions.")
      .addText((text) =>
        text
          .setValue(settings.completions.maxTokens.toString())
          .onChange(async (value) => {
            settings.completions.maxTokens =
              parseInt(value) || DEFAULT_SETTINGS.completions.maxTokens;
            await plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName("Temperature")
      .setDesc("Set the temperature for inline completions.")
      .addText((text) =>
        text
          .setValue(settings.completions.temperature.toString())
          .onChange(async (value) => {
            settings.completions.temperature =
              parseFloat(value) || DEFAULT_SETTINGS.completions.temperature;
            await plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName("Window size")
      .setDesc(
        "Set the window size for inline completions. The window size the number of characters around the cursor used to obtain inline completions"
      )
      .addText((text) =>
        text
          .setValue(settings.completions.windowSize.toString())
          .onChange(async (value) => {
            settings.completions.windowSize =
              parseInt(value) || DEFAULT_SETTINGS.completions.windowSize;
            await plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName("Accept key")
      .setDesc(
        "Set the key to accept inline completions. The list of available keys can be found at: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values"
      )
      .addText((text) =>
        text
          .setValue(settings.completions.acceptKey)
          .onChange(async (value) => {
            settings.completions.acceptKey = value;
            await plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName("Reject key")
      .setDesc(
        "Set the key to reject inline completions. The list of available keys can be found at: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values"
      )
      .addText((text) =>
        text
          .setValue(settings.completions.rejectKey)
          .onChange(async (value) => {
            settings.completions.rejectKey = value;
            await plugin.saveSettings();
          })
      );

    containerEl.createEl("h2", { text: "Chat view" });

    new Setting(containerEl)
      .setName("Enable chat view")
      .setDesc("Turn this on to enable chat view.")
      .addToggle((toggle) =>
        toggle.setValue(settings.chat.enabled).onChange(async (value) => {
          settings.chat.enabled = value;
          await plugin.saveSettings();
          if (value) {
            plugin.activateView();
          } else {
            plugin.deactivateView();
          }
          this.display(); // Re-render settings tab
        })
      );
    new Setting(containerEl)
      .setDisabled(!settings.chat.enabled)
      .setName("Model")
      .setDesc("Select the model for GPT.")
      .addDropdown((dropdown) => {
        for (const option of CHAT_COMPLETIONS_MODELS) {
          dropdown.addOption(option, option);
        }
        dropdown.setValue(settings.chat.model);
        dropdown.onChange(async (value) => {
          settings.chat.model = value as ChatCompletionsModel;
          await plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setDisabled(!settings.chat.enabled)
      .setName("Max tokens")
      .setDesc("Set the max tokens for chat view.")
      .addText((text) =>
        text
          .setValue(settings.chat.maxTokens.toString())
          .onChange(async (value) => {
            settings.chat.maxTokens =
              parseInt(value) || DEFAULT_SETTINGS.chat.maxTokens;
            await plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setDisabled(!settings.chat.enabled)
      .setName("Temperature")
      .setDesc("Set the temperature for chat view.")
      .addText((text) =>
        text
          .setValue(settings.chat.temperature.toString())
          .onChange(async (value) => {
            settings.chat.temperature =
              parseFloat(value) || DEFAULT_SETTINGS.chat.temperature;
            await plugin.saveSettings();
          })
      );
  }
}
