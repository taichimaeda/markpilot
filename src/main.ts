import { Extension } from '@codemirror/state';
import { addIcon, Notice, Plugin, setIcon, WorkspaceLeaf } from 'obsidian';
import { APIClient, ChatMessage } from './api';
import { OllamaAPIClient } from './api/clients/ollama';
import { OpenAIAPIClient } from './api/clients/openai';
import { OpenRouterAPIClient } from './api/clients/openrouter';
import { PromptGenerator } from './api/prompts/generator';
import { Provider } from './api/providers';
import { CostsTracker } from './api/providers/costs';
import { IgnoredFilter } from './api/proxies/ignored-filter';
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
		this.registerView(CHAT_VIEW_TYPE, (leaf) => this.createChatView(leaf));

		this.registerCustomIcons(); // Must be called before `registerRibbonActions()`.
		this.registerRibbonActions();
		this.registerCommands();

		// NOTE:
		// Activating the chat view on launch seems to be problematic.
		// This is a temporary workaround to ensure that the chat view is activated:
		await sleep(1000);
		if (settings.chat.enabled) {
			await this.activateChatView();
		}
	}

	registerCustomIcons() {
		addIcon('bot-off', botOffIcon);
	}

	registerRibbonActions() {
		const { settings } = this;

		const toggleCompletionsItem = this.addRibbonIcon(
			settings.completions.enabled ? 'bot' : 'bot-off',
			'Toggle inline completions',
			async () => {
				this.settings.completions.enabled = !this.settings.completions.enabled;
				setIcon(
					toggleCompletionsItem,
					this.settings.completions.enabled ? 'bot' : 'bot-off',
				);
				await this.saveSettings();
				new Notice(
					`Inline completions ${this.settings.completions.enabled ? 'enabled' : 'disabled'}.`,
				);
			},
		);
	}

	registerCommands() {
		const { workspace } = this.app;

		this.addCommand({
			id: 'enable-completions',
			name: 'Enable inline completions',
			callback: async () => {
				this.settings.completions.enabled = true;
				await this.saveSettings();
				new Notice('Inline completions enabled.');
			},
		});

		this.addCommand({
			id: 'disable-completions',
			name: 'Disable inline completions',
			callback: async () => {
				this.settings.completions.enabled = false;
				await this.saveSettings();
				new Notice('Inline completions disabled.');
			},
		});

		this.addCommand({
			id: 'toggle-completions',
			name: 'Toggle inline completions',
			callback: async () => {
				this.settings.completions.enabled = !this.settings.completions.enabled;
				await this.saveSettings();
				new Notice(
					`Inline completions ${this.settings.completions.enabled ? 'enabled' : 'disabled'}.`,
				);
			},
		});

		this.addCommand({
			id: 'enable-chat-view',
			name: 'Enable chat view',
			callback: async () => {
				this.settings.chat.enabled = true;
				await this.saveSettings();
				await this.activateChatView();
				new Notice('Chat view enabled.');
			},
		});

		this.addCommand({
			id: 'disable-chat-view',
			name: 'Disable chat view',
			callback: async () => {
				this.settings.chat.enabled = false;
				await this.saveSettings();
				await this.deactivateChatView();
				new Notice('Chat view disabled.');
			},
		});

		this.addCommand({
			id: 'toggle-chat-view',
			name: 'Toggle chat view',
			callback: async () => {
				this.settings.chat.enabled = !this.settings.chat.enabled;
				await this.saveSettings();
				await this.deactivateChatView();
				new Notice(
					`Chat view ${this.settings.completions.enabled ? 'enabled' : 'disabled'}.`,
				);
			},
		});

		this.addCommand({
			id: 'clear-chat-history',
			name: 'Clear chat history',
			callback: async () => {
				this.settings.chat.history = {
					messages: [],
					response: '',
				};
				await this.saveSettings();
				// We should avoid managing references to the views directly
				// and use `getLeavesOfType()` instead:
				// https://docs.obsidian.md/Plugins/User+interface/Views
				const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
				for (const leaf of leaves) {
					if (leaf.view instanceof ChatView) {
						leaf.view.clear?.();
					}
				}
				new Notice('Chat history cleared.');
			},
		});

		this.addCommand({
			id: 'enable-cache',
			name: 'Enable cache',
			callback: async () => {
				this.settings.cache.enabled = true;
				await this.saveSettings();
				new Notice('Cache enabled.');
			},
		});

		this.addCommand({
			id: 'disable-cache',
			name: 'Disable cache',
			callback: async () => {
				this.settings.cache.enabled = false;
				await this.saveSettings();
				new Notice('Cache disabled.');
			},
		});

		this.addCommand({
			id: 'toggle-cache',
			name: 'Toggle cache',
			callback: async () => {
				this.settings.cache.enabled = !this.settings.cache.enabled;
				await this.saveSettings();
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
		const clientWithFilter = new IgnoredFilter(client, this);
		const clientWithMonitor = new UsageMonitorProxy(clientWithFilter, this);
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
			if (!this.settings.completions.enabled) {
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

		return new ChatView(leaf, debounced, cancel, this);
	}

	async activateChatView() {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
		if (leaves.length > 0) {
			return;
		}

		const newLeaf = workspace.getRightLeaf(false);
		await newLeaf?.setViewState({ type: CHAT_VIEW_TYPE, active: true });
	}

	async deactivateChatView() {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
		for (const leaf of leaves) {
			leaf.detach();
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
}
