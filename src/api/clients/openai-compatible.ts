import { getEncoding } from 'js-tiktoken';
import { Notice } from 'obsidian';
import OpenAI from 'openai';
import Markpilot from 'src/main';
import { APIClient, ChatMessage } from '..';
import { PromptGenerator } from '../prompts/generator';
import { Provider } from '../providers';
import { CostsTracker } from '../providers/costs';
import { DEFAULT_MODELS } from '../providers/models';

export abstract class OpenAICompatibleAPIClient implements APIClient {
	constructor(
		protected generator: PromptGenerator,
		protected tracker: CostsTracker,
		protected plugin: Markpilot,
	) {}

	abstract get provider(): Provider;

	abstract get openai(): OpenAI | undefined;

	async *fetchChat(messages: ChatMessage[]) {
		if (this.openai === undefined) {
			return;
		}

		const { settings } = this.plugin;
		try {
			const prompt = this.generator.generateChatPrompt(messages);
			const stream = await this.openai.chat.completions.create({
				messages: prompt,
				model:
					settings.chat.model + settings.chat.modelTag
						? `:${settings.chat.modelTag}`
						: '',
				max_tokens: settings.chat.maxTokens,
				temperature: settings.chat.temperature,
				top_p: 1,
				n: 1,
				stream: true,
			});

			const contents = [];
			for await (const chunk of stream) {
				const content = chunk.choices[0].delta.content ?? '';
				contents.push(content);
				yield content;
			}

			// Update usage cost estimates.
			const enc = getEncoding('gpt2'); // Assume GPT-2 encoding
			const inputMessage = messages
				.map((message) => message.content)
				.join('\n');
			const outputMessage = contents.join('');
			const inputTokens = enc.encode(inputMessage).length;
			const outputTokens = enc.encode(outputMessage).length;
			await this.tracker.add(
				settings.chat.provider,
				settings.chat.model,
				inputTokens,
				outputTokens,
			);
		} catch (error) {
			console.error(error);
			new Notice(
				'Failed to fetch chat completions. Make sure your API key or API URL is correct.',
			);
		}
	}

	async fetchCompletions(prefix: string, suffix: string) {
		if (this.openai === undefined) {
			return;
		}

		const { settings } = this.plugin;
		try {
			const prompt = this.generator.generateCompletionsPrompt(prefix, suffix);
			const completions = await this.openai.chat.completions.create({
				messages: prompt,
				model:
					settings.completions.model + settings.completions.modelTag
						? `:${settings.completions.modelTag}`
						: '',
				max_tokens: settings.completions.maxTokens,
				temperature: settings.completions.temperature,
				top_p: 1,
				n: 1,
				stop: ['\n\n\n'],
			});

			// Update usage cost estimates.
			const inputTokens = completions.usage?.prompt_tokens ?? 0;
			const outputTokens = completions.usage?.completion_tokens ?? 0;
			await this.tracker.add(
				settings.completions.provider,
				settings.completions.model,
				inputTokens,
				outputTokens,
			);

			const content = completions.choices[0].message.content;
			if (content === null) {
				return;
			}
			return this.generator.parseResponse(content);
		} catch (error) {
			console.error(error);
			new Notice(
				'Failed to fetch completions.  Make sure your API key or API URL is correct.',
			);
		}
	}

	async testConnection() {
		if (this.openai === undefined) {
			return false;
		}

		try {
			const response = await this.openai.chat.completions.create({
				messages: [
					{
						role: 'user',
						content: 'Say this is a test',
					},
				],
				model: DEFAULT_MODELS[this.provider],
				max_tokens: 1,
				temperature: 0,
				top_p: 1,
				n: 1,
			});

			return response.choices[0].message.content !== '';
		} catch (error) {
			console.error(error);
			return false;
		}
	}
}
