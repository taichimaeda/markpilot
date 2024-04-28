import Markpilot from 'src/main';
import { FewShotPrompt } from '.';
import { ChatMessage } from '..';
import { CHAT_PROMPT } from './chat';
import { BLOCK_QUOTE_PROMPT } from './completions/block-quote';
import { CODE_BLOCK_PROMPT } from './completions/code-block';
import { HEADING_PROMPT } from './completions/heading';
import { LIST_ITEM_PROMPT } from './completions/list-item';
import { MATH_BLOCK_PROMPT } from './completions/math-block';
import { PARAGRAPH_PROMPT } from './completions/paragraph';
import { Context, getContext, getLanguage } from './context';

const COMPLETIONS_PROMPTS: Record<Context, FewShotPrompt> = {
	heading: HEADING_PROMPT,
	paragraph: PARAGRAPH_PROMPT,
	'list-item': LIST_ITEM_PROMPT,
	'block-quote': BLOCK_QUOTE_PROMPT,
	'math-block': MATH_BLOCK_PROMPT,
	'code-block': CODE_BLOCK_PROMPT,
};

export class PromptGenerator {
	constructor(private plugin: Markpilot) {}

	generateChatPrompt(messages: ChatMessage[]) {
		const prompt = CHAT_PROMPT;
		const system = prompt.system;

		return [
			{
				role: 'system',
				content: system,
			},
			...this.makeChatExamples(),
			...messages,
		] as ChatMessage[];
	}

	generateCompletionsPrompt(prefix: string, suffix: string) {
		const { settings } = this.plugin;

		const context = getContext(prefix, suffix);
		const prompt = COMPLETIONS_PROMPTS[context];
		const system =
			context === 'code-block'
				? prompt.system.replace('{{LANGUAGE}}', getLanguage(prefix, suffix)!)
				: prompt.system;

		const windowSize = settings.completions.windowSize;
		const truncatedPrefix = prefix.slice(
			prefix.length - windowSize / 2,
			prefix.length,
		);
		const truncatedSuffix = suffix.slice(0, windowSize / 2);

		return [
			{
				role: 'system',
				content: system,
			},
			...this.makeCompletionsExamples(prefix, suffix),
			{
				role: 'user',
				content: `${truncatedPrefix}<MASK>${truncatedSuffix}`,
			},
		] as ChatMessage[];
	}

	makeChatExamples() {
		const { settings } = this.plugin;

		if (!settings.chat.fewShot) {
			return [];
		}

		const prompt = CHAT_PROMPT;
		return prompt.examples.flatMap((example) => [
			{
				role: 'user',
				content: example.user,
			},
			{
				role: 'assistant',
				content: example.assistant,
			},
		]);
	}

	makeCompletionsExamples(prefix: string, suffix: string) {
		const { settings } = this.plugin;

		if (!settings.completions.fewShot) {
			return [];
		}

		const context = getContext(prefix, suffix);
		const prompt = COMPLETIONS_PROMPTS[context];
		return prompt.examples.flatMap((example) => [
			{
				role: 'user',
				content: example.user,
			},
			{
				role: 'assistant',
				content: example.assistant,
			},
		]);
	}

	parseResponse(content: string) {
		const lines = content.split('\n');
		return lines.slice(lines.indexOf('<INSERT>') + 1).join('\n');
	}
}
