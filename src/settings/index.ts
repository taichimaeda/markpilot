import Chart from 'chart.js/auto';
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { ChatHistory } from 'src/api';
import {
	DEFAULT_PROVIDER,
	Provider,
	PROVIDERS,
	PROVIDERS_NAMES,
} from 'src/api/providers';
import { DEFAULT_MODELS, Model, MODELS } from 'src/api/providers/models';

import Markpilot from '../main';
import { getDaysInCurrentMonth } from '../utils';

export interface MarkpilotSettings {
	version: string;
	backups: Record<string, object>; // e.g. '1.1.0' to { ... }
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
		modelTag: string | undefined; // For Ollama models
		fewShot: boolean;
		maxTokens: number;
		temperature: number;
		waitTime: number;
		windowSize: number;
		acceptKey: string;
		rejectKey: string;
		ignoredFiles: string[];
		ignoredTags: string[];
	};
	chat: {
		enabled: boolean;
		provider: Provider;
		model: Model;
		modelTag: string | undefined; // For Ollama models
		fewShot: boolean;
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
	backups: {},
	providers: {
		openai: {
			apiKey: undefined,
		},
		openrouter: {
			apiKey: undefined,
		},
		ollama: {
			apiUrl: 'http://127.0.0.1:11434/v1/',
		},
	},
	completions: {
		enabled: true,
		provider: DEFAULT_PROVIDER,
		model: DEFAULT_MODELS[DEFAULT_PROVIDER],
		modelTag: undefined,
		// Few-shot prompts are still in beta
		fewShot: false,
		maxTokens: 64,
		temperature: 0,
		waitTime: 500,
		windowSize: 512,
		acceptKey: 'Tab',
		rejectKey: 'Escape',
		ignoredFiles: [],
		ignoredTags: [],
	},
	chat: {
		enabled: true,
		provider: DEFAULT_PROVIDER,
		model: DEFAULT_MODELS[DEFAULT_PROVIDER],
		modelTag: undefined,
		// Few-shot prompts are still in beta
		fewShot: false,
		maxTokens: 4096,
		temperature: 0.5,
		history: {
			messages: [],
			response: '',
		},
	},
	cache: {
		enabled: true,
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
						// NOTE:
						// The API client needs to be updated when the API key, API URL or provider is changed,
						// because these parameters are captured by the underlying library on initialization
						// and become stale when the settings are changed.
						plugin.updateAPIClient();
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
						plugin.updateAPIClient();
						new Notice('Successfully saved OpenRouter API key.');
					}),
			);

		new Setting(containerEl)
			.setName('Ollama API URL')
			.setDesc(
				"Enter your Ollama API URL. You should use '127.0.0.1' instead of 'localhost' to avoid issues related to IPv4/IPv6.",
			)
			.addText((text) =>
				text
					.setValue(settings.providers.ollama.apiUrl ?? '')
					.onChange(async (value) => {
						settings.providers.ollama.apiUrl = value;
						await plugin.saveSettings();
						plugin.updateAPIClient();
					}),
			);

		new Setting(containerEl)
			.setName('Test OpenAI API connection')
			.setDesc('Test the connection to the OpenAI API.')
			.addButton((button) =>
				button.setButtonText('Test Connection').onClick(async () => {
					const client = this.plugin.createAPIClient('openai');
					if (await client.testConnection()) {
						new Notice('Successfully connected to OpenAI API.');
					} else {
						new Notice('Failed to connect to OpenAI API.');
					}
				}),
			);

		new Setting(containerEl)
			.setName('Test OpenRouter API connection')
			.setDesc('Test the connection to the OpenRouter API.')
			.addButton((button) =>
				button.setButtonText('Test Connection').onClick(async () => {
					const client = this.plugin.createAPIClient('openrouter');
					if (await client.testConnection()) {
						new Notice('Successfully connected to OpenRouter API.');
					} else {
						new Notice('Failed to connect to OpenRouter API.');
					}
				}),
			);

		new Setting(containerEl)
			.setName('Test Ollama API connection')
			.setDesc('Test the connection to the local Ollama API.')
			.addButton((button) =>
				button.setButtonText('Test Connection').onClick(async () => {
					const client = this.plugin.createAPIClient('ollama');
					if (await client.testConnection()) {
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
			.setName('Provider')
			.setDesc('Select the provider for inline completions.')
			.addDropdown((dropdown) => {
				for (const option of PROVIDERS) {
					dropdown.addOption(option, PROVIDERS_NAMES[option]);
				}
				dropdown
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.provider)
					.onChange(async (value) => {
						settings.completions.provider = value as Provider;
						settings.completions.model = DEFAULT_MODELS[value as Provider];
						await plugin.saveSettings();
						plugin.updateAPIClient();
						this.display(); // Re-render settings tab
					});
			});

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Select the model for inline completions.')
			.addDropdown((dropdown) => {
				for (const option of MODELS[settings.completions.provider]) {
					dropdown.addOption(option, option);
				}
				dropdown
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.model)
					.onChange(async (value) => {
						settings.completions.model = value as Model;
						await plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Model tag')
			.setDesc('Enter the model tag for Ollama models. This is optional.')
			.addText((text) =>
				text
					.setDisabled(
						!settings.completions.enabled ||
							settings.completions.provider !== 'ollama',
					)
					.setValue(settings.completions.modelTag ?? '')
					.onChange(async (value) => {
						settings.completions.modelTag = value;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Few-shot prompts (Beta)')
			.setDesc(
				'Turn this on to enable few-shot prompts for inline completions. This is a beta feature and may not work as expected.',
			)
			.addToggle((toggle) =>
				toggle
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.fewShot)
					.onChange(async (value) => {
						settings.completions.fewShot = value;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Max tokens')
			.setDesc('Set the max tokens for inline completions.')
			.addText((text) =>
				text
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.maxTokens.toString())
					.onChange(async (value) => {
						const amount = parseInt(value);
						if (isNaN(amount) || amount < 0) {
							return;
						}
						settings.completions.maxTokens = amount;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Set the temperature for inline completions.')
			.addSlider((slider) =>
				slider
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.temperature)
					.setLimits(0, 1, 0.01)
					// TODO:
					// Figure out how to add unit to the slider
					.setDynamicTooltip()
					.onChange(async (value) => {
						settings.completions.temperature = value;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Wait time')
			.setDesc(
				'Time in milliseconds which it will wait for before fetching inline completions from the server.',
			)
			.addSlider((slider) =>
				slider
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.waitTime)
					.setLimits(0, 1000, 100)
					.setDynamicTooltip()
					.onChange(async (value) => {
						settings.completions.waitTime = value;
						await plugin.saveSettings();
						// NOTE:
						// Editor extension needs to be updated when settings are changed
						// because some fields e.g. `acceptKey` become stale and there is no way
						// to make the extension query it on the fly.
						plugin.updateEditorExtension();
					}),
			);

		new Setting(containerEl)
			.setName('Window size')
			.setDesc(
				'Set the window size for inline completions. The window size the number of characters around the cursor used to obtain inline completions',
			)
			.addText((text) =>
				text
					.setValue(settings.completions.windowSize.toString())
					.onChange(async (value) => {
						const amount = parseInt(value);
						if (isNaN(amount) || amount < 0) {
							return;
						}
						settings.completions.windowSize = amount;
						await plugin.saveSettings();
						plugin.updateEditorExtension();
					}),
			);

		new Setting(containerEl)
			.setName('Accept key')
			.setDesc(
				'Set the key to accept inline completions. The list of available keys can be found at: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values',
			)
			.addText((text) =>
				text
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.acceptKey)
					.onChange(async (value) => {
						settings.completions.acceptKey = value;
						await plugin.saveSettings();
						plugin.updateEditorExtension();
					}),
			);

		new Setting(containerEl)
			.setName('Reject key')
			.setDesc(
				'Set the key to reject inline completions. The list of available keys can be found at: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values',
			)
			.addText((text) =>
				text
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.rejectKey)
					.onChange(async (value) => {
						settings.completions.rejectKey = value;
						await plugin.saveSettings();
						plugin.updateEditorExtension();
					}),
			);

		new Setting(containerEl)

			.setName('Ignored files')
			.setDesc(
				'Set the list of files to ignore inline completions line by line. The completions will not be triggered in these files. You can use glob patterns in Bash.',
			)
			.addTextArea((text) =>
				text
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.ignoredFiles.join('\n'))
					.setPlaceholder('Private.md\nPrivate/**/*.md')
					.onChange(async (value) => {
						settings.completions.ignoredFiles = value.split('\n');
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Ignored tags')
			.setDesc(
				"Set the list of tags to ignore inline completions line by line. The completions will not be triggered in these tags. You can use Regex for this, but make sure to add '#' in front and avoid using '.' as this will match whitespace characters too",
			)
			.addTextArea((text) =>
				text
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.ignoredTags.join('\n'))
					.setPlaceholder('#Private\n#Private\\S*\n#Draft[0-9]+')
					.onChange(async (value) => {
						settings.completions.ignoredTags = value.split('\n');
						await plugin.saveSettings();
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
					if (settings.chat.enabled) {
						await plugin.activateChatView();
					} else {
						await plugin.deactivateChatView();
					}
					this.display(); // Re-render settings tab
				}),
			);

		new Setting(containerEl)
			.setName('Provider')
			.setDesc('Select the provider for chat view.')
			.addDropdown((dropdown) => {
				for (const option of PROVIDERS) {
					dropdown.addOption(option, PROVIDERS_NAMES[option]);
				}
				dropdown
					.setDisabled(!settings.chat.enabled)
					.setValue(settings.chat.provider)
					.onChange(async (value) => {
						settings.chat.provider = value as Provider;
						settings.chat.model = DEFAULT_MODELS[value as Provider];
						await plugin.saveSettings();
						plugin.updateAPIClient();
						this.display(); // Re-render settings tab
					});
			});

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Select the model for GPT.')
			.addDropdown((dropdown) => {
				for (const option of MODELS[settings.chat.provider]) {
					dropdown.addOption(option, option);
				}
				dropdown
					.setDisabled(!settings.chat.enabled)
					.setValue(settings.chat.model)
					.onChange(async (value) => {
						settings.chat.model = value as Model;
						await plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Model tag')
			.setDesc('Enter the model tag for Ollama models. This is optional.')
			.addText((text) =>
				text
					.setDisabled(
						!settings.chat.enabled || settings.chat.provider !== 'ollama',
					)
					.setValue(settings.chat.modelTag ?? '')
					.onChange(async (value) => {
						settings.chat.modelTag = value;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Few-shot prompts (Beta)')
			.setDesc(
				'Turn this on to enable few-shot prompts for chat view. This is a beta feature and may not work as expected.',
			)
			.addToggle((toggle) =>
				toggle
					.setDisabled(!settings.chat.enabled)
					.setValue(settings.chat.fewShot)
					.onChange(async (value) => {
						settings.chat.fewShot = value;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Max tokens')
			.setDesc('Set the max tokens for chat view.')
			.addText((text) =>
				text
					.setValue(settings.chat.maxTokens.toString())
					.onChange(async (value) => {
						const amount = parseFloat(value);
						if (isNaN(amount) || amount < 0) {
							return;
						}
						settings.chat.maxTokens = amount;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Set the temperature for chat view.')
			.addSlider((slider) =>
				slider
					.setDisabled(!settings.chat.enabled)
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
				toggle
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.cache.enabled)
					.onChange(async (value) => {
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
			.addText((text) =>
				text
					.setValue(settings.usage.monthlyLimit.toString())
					.onChange(async (value) => {
						const amount = parseFloat(value);
						if (isNaN(amount) || amount < 0) {
							return;
						}
						settings.usage.monthlyLimit = amount;
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
		// TODO:
		// Replace with "Text Colors":
		// https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors#Text+colors
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
