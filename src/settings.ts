import { App, PluginSettingTab, Setting } from "obsidian";

import ObsidianCopilot from "./main";

export class ObsidianCopilotSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: ObsidianCopilot
  ) {
    super(app, plugin);
  }

  async display() {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsidian Copilot" });

    const { plugin } = this;
    const { settings } = plugin;

    new Setting(containerEl)
      .setName("OpenAI API Key")
      .setDesc("Enter your OpenAI API key to enable GPT.")
      .addText((text) =>
        text.setValue(settings.apiKey ?? "").onChange(async (value) => {
          settings.apiKey = value;
          await plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable inline completion")
      .setDesc("Turn this on to enable inline completion with GPT.")
      .addToggle((toggle) =>
        toggle.setValue(settings.enableCompletion).onChange(async (value) => {
          settings.enableCompletion = value;
          await plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable chat")
      .setDesc("Turn this on to enable chat features with GPT.")
      .addToggle((toggle) =>
        toggle.setValue(settings.enableChat).onChange(async (value) => {
          settings.enableChat = value;
          await plugin.saveSettings();

          if (value) {
            plugin.activateView();
          } else {
            plugin.deactivateView();
          }
        })
      );
  }
}
