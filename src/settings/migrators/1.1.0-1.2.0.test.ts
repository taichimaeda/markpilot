import { test } from '@jest/globals';
import { MarkpilotSettings1_1_0 } from '../versions/1.1.0';
import { MarkpilotSettings1_2_0 } from '../versions/1.2.0';
import { migrateVersion1_1_0_toVersion1_2_0 } from './1.1.0-1.2.0';

// TODO:
// Randomise the values in both versions.
const version1_1_0: MarkpilotSettings1_1_0 = {
	apiKey: 'test',
	completions: {
		enabled: true,
		model: 'gpt-3.5-turbo-instruct',
		maxTokens: 10,
		temperature: 0.5,
		waitTime: 10,
		windowSize: 10,
		acceptKey: 'Enter',
		rejectKey: 'Escape',
	},
	chat: {
		enabled: true,
		model: 'gpt-4',
		maxTokens: 10,
		temperature: 0.1,
		history: {
			messages: [],
			response: '',
		},
	},
	cache: {
		enabled: true,
	},
	usage: {
		dailyCosts: {
			'2021-09-01': 10.0,
		},
		monthlyCosts: {
			'2021-09': 100.0,
		},
		monthlyLimit: 1000,
	},
};

const version1_2_0: MarkpilotSettings1_2_0 = {
	version: '1.2.0',
	backups: {
		'1.1.0': structuredClone(version1_1_0),
	},
	providers: {
		openai: {
			apiKey: 'test',
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
		provider: 'openai',
		model: 'gpt-3.5-turbo',
		fewShot: false,
		maxTokens: 10,
		temperature: 0.5,
		waitTime: 10,
		windowSize: 10,
		acceptKey: 'Tab',
		rejectKey: 'Escape',
		ignoredFiles: [],
		ignoredTags: [],
	},
	chat: {
		enabled: true,
		provider: 'openai',
		model: 'gpt-4',
		fewShot: false,
		maxTokens: 10,
		temperature: 1,
		history: {
			messages: [],
			response: '',
		},
	},
	cache: {
		enabled: true,
	},
	usage: {
		dailyCosts: {
			'2021-09-01': 10.0,
		},
		monthlyCosts: {
			'2021-09': 100.0,
		},
		monthlyLimit: 1000,
	},
};

test('Migration from version 1.1.0 to 1.2.0', () => {
	const migrated = migrateVersion1_1_0_toVersion1_2_0(version1_1_0);
	expect(migrated).toStrictEqual(version1_2_0);
});
