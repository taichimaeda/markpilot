import { FewShotPrompt } from '../..';
import example1Assistant from './example1/assistant.txt';
import example1User from './example1/user.md';
import system from './system.txt';

export const BLOCK_QUOTE_PROMPT: FewShotPrompt = {
	system,
	examples: [
		{
			user: example1User,
			assistant: example1Assistant,
		},
	],
};
