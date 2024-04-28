export const COMPLETIONS_MODELS = [
	'gpt-3.5-turbo-instruct',
	'davinci-002',
	'babbage-002',
] as const;

export const CHAT_COMPLETIONS_MODELS = [
	'gpt-4-0125-preview',
	'gpt-4-turbo-preview',
	'gpt-4-1106-preview',
	'gpt-4-vision-preview',
	'gpt-4',
	'gpt-4-0314',
	'gpt-4-0613',
	'gpt-4-32k',
	'gpt-4-32k-0314',
	'gpt-4-32k-0613',
	'gpt-3.5-turbo',
	'gpt-3.5-turbo-16k',
	'gpt-3.5-turbo-0301',
	'gpt-3.5-turbo-0613',
	'gpt-3.5-turbo-1106',
	'gpt-3.5-turbo-0125',
	'gpt-3.5-turbo-16k-0613',
] as const;

export const MODEL_INPUT_COSTS: Record<
	| (typeof COMPLETIONS_MODELS)[number]
	| (typeof CHAT_COMPLETIONS_MODELS)[number],
	number
> = {
	'gpt-3.5-turbo-instruct': 1.5,
	'davinci-002': 12.0,
	'babbage-002': 1.6,
	'gpt-4-0125-preview': 10.0,
	'gpt-4-turbo-preview': 10.0,
	'gpt-4-1106-preview': 10.0,
	'gpt-4-vision-preview': 10.0,
	'gpt-4': 30.0,
	'gpt-4-0314': 30.0,
	'gpt-4-0613': 30.0,
	'gpt-4-32k': 60.0,
	'gpt-4-32k-0314': 60.0,
	'gpt-4-32k-0613': 60.0,
	'gpt-3.5-turbo': 0.5,
	'gpt-3.5-turbo-16k': 0.5,
	'gpt-3.5-turbo-0301': 0.5,
	'gpt-3.5-turbo-0613': 0.5,
	'gpt-3.5-turbo-1106': 0.5,
	'gpt-3.5-turbo-0125': 0.5,
	'gpt-3.5-turbo-16k-0613': 0.5,
} as const;

export const MODEL_OUTPUT_COSTS: Record<
	| (typeof COMPLETIONS_MODELS)[number]
	| (typeof CHAT_COMPLETIONS_MODELS)[number],
	number
> = {
	'gpt-3.5-turbo-instruct': 2.0,
	'davinci-002': 12.0,
	'babbage-002': 1.6,
	'gpt-4-0125-preview': 30,
	'gpt-4-turbo-preview': 30,
	'gpt-4-1106-preview': 30,
	'gpt-4-vision-preview': 30,
	'gpt-4': 60,
	'gpt-4-0314': 60,
	'gpt-4-0613': 60,
	'gpt-4-32k': 120,
	'gpt-4-32k-0314': 120,
	'gpt-4-32k-0613': 120,
	'gpt-3.5-turbo': 1.5,
	'gpt-3.5-turbo-16k': 1.5,
	'gpt-3.5-turbo-0301': 1.5,
	'gpt-3.5-turbo-0613': 1.5,
	'gpt-3.5-turbo-1106': 1.5,
	'gpt-3.5-turbo-0125': 1.5,
	'gpt-3.5-turbo-16k-0613': 1.5,
};

export type CompletionsModel = (typeof COMPLETIONS_MODELS)[number];

export type ChatCompletionsModel = (typeof CHAT_COMPLETIONS_MODELS)[number];

export type ChatRole = 'system' | 'assistant' | 'user';

export interface ChatMessage {
	role: ChatRole;
	content: string;
}

export interface ChatHistory {
	messages: ChatMessage[];
	response: string;
}
