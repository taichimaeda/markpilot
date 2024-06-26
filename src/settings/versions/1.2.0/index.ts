import { ChatHistory } from './api';
import { Provider } from './api/providers';
import { Model } from './api/providers/models';

export interface MarkpilotSettings1_2_0 {
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
