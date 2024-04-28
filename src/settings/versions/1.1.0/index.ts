import {
	ChatCompletionsModel,
	ChatHistory,
	CompletionsModel,
} from './api/openai';

export interface MarkpilotSettings1_1_0 {
	apiKey: string | undefined;
	completions: {
		enabled: boolean;
		model: CompletionsModel;
		maxTokens: number;
		temperature: number;
		waitTime: number;
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
	cache: {
		enabled: boolean;
	};
	usage: {
		dailyCosts: Record<string, number>; // e.g. '2021-09-01' to 10.0 (USD)
		monthlyCosts: Record<string, number>; // e.g. '2021-09' to 100.0 (USD)
		monthlyLimit: number;
	};
}
