import Chart from 'chart.js/auto';
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { Model, MODELS, Provider, PROVIDERS } from './api/provider';
import { ChatHistory } from './api/types';

import Markpilot from './main';
import { getDaysInCurrentMonth, validateURL } from './utils';

export interface MarkpilotSettings {
  version: string;
  providers: {
    openai: {
      apiKey: string | undefined;
    };
    openrouter: {
      apiKey: string | undefined;
    };
    ollama: {
      apiUrl: string | undefined;
    };
  };
  completions: {
    enabled: boolean;
    provider: Provider;
    model: Model;
    maxTokens: number;
    temperature: number;
    waitTime: number;
    windowSize: number;
    acceptKey: string;
    rejectKey: string;
  };
  chat: {
    enabled: boolean;
    provider: Provider;
    model: Model;
    maxTokens: number;
    temperature: number;
    history: ChatHistory;
  };
  cache: {
    enabled: boolean;
  };
  usage: {
    dailyCosts: Record<string, number>; // e.g. '2021-09-01' to 10.0 (USD)
    monthlyCosts: Record<string, number>; // e.g. '2021-09' to 100.0 (USD)
    monthlyLimit: number;
  };
}

export const DEFAULT_SETTINGS: MarkpilotSettings = {
  version: '1.2.0',
  providers: {
    openai: {
      apiKey: undefined,
    },
    openrouter: {
      apiKey: undefined,
    },
    ollama: {
      apiUrl: undefined,
    },
  },
  completions: {
    enabled: true,
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    maxTokens: 64,
    temperature: 0,
    waitTime: 500,
    windowSize: 512,
    acceptKey: 'Tab',
    rejectKey: 'Escape',
  },
  chat: {
    enabled: true,
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    maxTokens: 1024,
    temperature: 0.5,
    history: {
      messages: [],
      response: '',
    },
  },
  cache: {
    enabled: false,
  },
  usage: {
    dailyCosts: {},
    monthlyCosts: {},
    monthlyLimit: 20,
  },
};

export class MarkpilotSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: Markpilot,
  ) {
    super(app, plugin);
  }

  async display() {
    const { containerEl } = this;

    containerEl.empty();

    const { plugin } = this;
    const { settings } = plugin;

    /************************************************************/
    /*                       Providers                         */
    /************************************************************/

    new Setting(containerEl).setName('Providers').setHeading();

    new Setting(containerEl)
      .setName('OpenAI API key')
      .setDesc('Enter your OpenAI API key.')
      .addText((text) =>
        text
          .setValue(settings.providers.openai.apiKey ?? '')
          .onChange(async (value) => {
            settings.providers.openai.apiKey = value;
            await plugin.saveSettings();
            new Notice('Successfully saved OpenAI API key.');
          }),
      );

    new Setting(containerEl)
      .setName('OpenRouter API key')
      .setDesc('Enter your OpenRouter API key.')
      .addText((text) =>
        text
          .setValue(settings.providers.openrouter.apiKey ?? '')
          .onChange(async (value) => {
            settings.providers.openrouter.apiKey = value;
            await plugin.saveSettings();
            new Notice('Successfully saved OpenRouter API key.');
          }),
      );

    new Setting(containerEl)
      .setName('Ollama API URL')
      .setDesc('Enter your Ollama API URL.')
      .addText((text) =>
        text
          .setValue(settings.providers.ollama.apiUrl ?? '')
          .onChange(async (value) => {
            if (validateURL(value)) {
              new Notice('Invalid Ollama API URL.');
              return;
            }
            settings.providers.ollama.apiUrl = value;
            await plugin.saveSettings();
            new Notice('Successfully saved Ollama API URL.');
          }),
      );

    new Setting(containerEl)
      .setName('Test Ollama API connection')
      .setDesc('Test the connection to the local Ollama API.')
      .addButton((button) =>
        button.setButtonText('Test Connection').onClick(async () => {
          const apiUrl = settings.providers.ollama.apiUrl;
          if (apiUrl === undefined) {
            new Notice('Ollama API URL is not set.');
            return;
          }
          // TODO
          const response = await fetch(apiUrl);
          if (response.ok) {
            new Notice('Successfully connected to Ollama API.');
          } else {
            new Notice('Failed to connect to Ollama API.');
          }
        }),
      );

    /************************************************************/
    /*                   Inline completions                     */
    /************************************************************/

    new Setting(containerEl).setName('Inline completions').setHeading();

    new Setting(containerEl)
      .setName('Enable inline completions')
      .setDesc('Turn this on to enable inline completions.')
      .addToggle((toggle) =>
        toggle
          .setValue(settings.completions.enabled)
          .onChange(async (value) => {
            settings.completions.enabled = value;
            await plugin.saveSettings();
            this.display(); // Re-render settings tab
          }),
      );

    new Setting(containerEl)
      .setDisabled(!settings.chat.enabled)
      .setName('Provider')
      .setDesc('Select the provider for inline completions.')
      .addDropdown((dropdown) => {
        for (const option of PROVIDERS) {
          dropdown.addOption(option, option);
        }
        dropdown.setValue(settings.completions.provider);
        dropdown.onChange(async (value) => {
          settings.completions.provider = value as Provider;
          await plugin.saveSettings();
          this.display(); // Re-render settings tab
        });
      });

    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName('Model')
      .setDesc('Select the model for inline completions.')
      .addDropdown((dropdown) => {
        for (const option of MODELS[settings.completions.provider]) {
          dropdown.addOption(option, option);
        }
        dropdown.setValue(settings.completions.model);
        dropdown.onChange(async (value) => {
          settings.completions.model = value as Model;
          await plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName('Max tokens')
      .setDesc('Set the max tokens for inline completions.')
      .addSlider((slider) =>
        slider
          .setValue(settings.completions.maxTokens)
          .setLimits(128, 8192, 128)
          .setDynamicTooltip()
          .onChange(async (value) => {
            settings.completions.maxTokens = value;
            await plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName('Temperature')
      .setDesc('Set the temperature for inline completions.')
      .addSlider((slider) =>
        slider
          .setValue(settings.completions.temperature)
          .setLimits(0, 1, 0.01)
          .setDynamicTooltip()
          .onChange(async (value) => {
            settings.completions.temperature = value;
            await plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName('Wait time')
      .setDesc(
        'Time in milliseconds which it will wait for before fetching inline completions from the server.',
      )
      .addSlider((slider) =>
        slider
          .setValue(settings.completions.waitTime)
          .setLimits(0, 1000, 100)
          .setDynamicTooltip()
          .onChange(async (value) => {
            settings.completions.waitTime = value;
            await plugin.saveSettings();
            // Editor extension needs to be updated when settings are changed
            // because some fields e.g. `acceptKey` become stale and there is no way
            // to make the extension query it on the fly.
            plugin.updateEditorExtension();
          }),
      );

    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName('Window size')
      .setDesc(
        'Set the window size for inline completions. The window size the number of characters around the cursor used to obtain inline completions',
      )
      .addSlider((slider) =>
        slider
          .setValue(settings.completions.windowSize)
          .setLimits(128, 8192, 128)
          .setDynamicTooltip()
          .onChange(async (value) => {
            settings.completions.windowSize = value;
            await plugin.saveSettings();
            plugin.updateEditorExtension();
          }),
      );

    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName('Accept key')
      .setDesc(
        'Set the key to accept inline completions. The list of available keys can be found at: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values',
      )
      .addText((text) =>
        text
          .setValue(settings.completions.acceptKey)
          .onChange(async (value) => {
            settings.completions.acceptKey = value;
            await plugin.saveSettings();
            plugin.updateEditorExtension();
          }),
      );

    new Setting(containerEl)
      .setDisabled(!settings.completions.enabled)
      .setName('Reject key')
      .setDesc(
        'Set the key to reject inline completions. The list of available keys can be found at: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values',
      )
      .addText((text) =>
        text
          .setValue(settings.completions.rejectKey)
          .onChange(async (value) => {
            settings.completions.rejectKey = value;
            await plugin.saveSettings();
            plugin.updateEditorExtension();
          }),
      );

    /************************************************************/
    /*                        Chat View                         */
    /************************************************************/

    new Setting(containerEl).setName('Chat view').setHeading();

    new Setting(containerEl)
      .setName('Enable chat view')
      .setDesc('Turn this on to enable chat view.')
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
        }),
      );

    new Setting(containerEl)
      .setDisabled(!settings.chat.enabled)
      .setName('Provider')
      .setDesc('Select the provider for chat view.')
      .addDropdown((dropdown) => {
        for (const option of PROVIDERS) {
          dropdown.addOption(option, option);
        }
        dropdown.setValue(settings.chat.provider);
        dropdown.onChange(async (value) => {
          settings.chat.provider = value as Provider;
          await plugin.saveSettings();
          this.display(); // Re-render settings tab
        });
      });

    new Setting(containerEl)
      .setDisabled(!settings.chat.enabled)
      .setName('Model')
      .setDesc('Select the model for GPT.')
      .addDropdown((dropdown) => {
        for (const option of MODELS[settings.chat.provider]) {
          dropdown.addOption(option, option);
        }
        dropdown.setValue(settings.chat.model);
        dropdown.onChange(async (value) => {
          settings.chat.model = value as Model;
          await plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setDisabled(!settings.chat.enabled)
      .setName('Max tokens')
      .setDesc('Set the max tokens for chat view.')
      .addSlider((slider) =>
        slider
          .setValue(settings.chat.maxTokens)
          .setLimits(128, 8192, 128)
          .setDynamicTooltip()
          .onChange(async (value) => {
            settings.chat.maxTokens = value;
            await plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setDisabled(!settings.chat.enabled)
      .setName('Temperature')
      .setDesc('Set the temperature for chat view.')
      .addSlider((slider) =>
        slider
          .setValue(settings.chat.temperature)
          .setLimits(0, 1, 0.01)
          .setDynamicTooltip()
          .onChange(async (value) => {
            settings.chat.temperature = value;
            await plugin.saveSettings();
          }),
      );

    /************************************************************/
    /*                          Cache                           */
    /************************************************************/

    new Setting(containerEl).setName('Cache').setHeading();

    new Setting(containerEl)
      .setName('Enable caching')
      .setDesc(
        'Turn this on to enable memory caching. The cached data will be invalided on startup.',
      )
      .addToggle((toggle) =>
        toggle.setValue(settings.cache.enabled).onChange(async (value) => {
          settings.cache.enabled = value;
          await plugin.saveSettings();
          this.display(); // Re-render settings tab
        }),
      );

    /************************************************************/
    /*                          Usage                           */
    /************************************************************/

    new Setting(containerEl).setName('Usage').setHeading();

    new Setting(containerEl)
      .setName('Monthly limit')
      .setDesc(
        'Set the monthly limit for the usage costs (USD). When this limit is reached, the plugin will disable both inline completions and chat view',
      )
      .addSlider((slider) =>
        slider
          .setValue(settings.usage.monthlyLimit)
          .setLimits(0, 100, 1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            settings.usage.monthlyLimit = value;
            await plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Monthly costs')
      .setDesc(
        'Below you can find the estimated usage of OpenAI API for inline completions and chat view this month',
      );

    this.showMonthlyCosts();
  }

  showMonthlyCosts() {
    const { plugin } = this;
    const { settings } = plugin;

    const { containerEl } = this;

    const dates = getDaysInCurrentMonth();
    const data = dates.map((date) => ({ date, cost: 0 }));
    for (const [day, cost] of Object.entries(settings.usage.dailyCosts)) {
      const target = new Date(day + 'T00:00:00').toDateString();
      const index = dates.findIndex((date) => date.toDateString() === target);
      if (index !== -1) {
        data[index].cost = cost;
      }
    }
    // Get the accent color from the theme
    // using CSS variables provided by Obsidian:
    // https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors#Accent+color
    const style = getComputedStyle(containerEl);
    const hue = style.getPropertyValue('--accent-h');
    const saturation = style.getPropertyValue('--accent-s');
    const lightness = style.getPropertyValue('--accent-l');
    const backgroundColor = `hsl(${hue}, ${saturation}, ${lightness})`;
    new Chart(containerEl.createEl('canvas'), {
      type: 'bar',
      options: {
        plugins: {
          tooltip: {
            callbacks: { label: (item) => `$${item.parsed.y}` },
          },
        },
      },
      data: {
        labels: data.map((row) => row.date.toDateString()),
        datasets: [
          {
            label: 'OpenAI API',
            data: data.map((row) => new Number(row.cost.toFixed(5))),
            backgroundColor,
          },
        ],
      },
    });
  }
}
