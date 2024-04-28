export interface FewShotPrompt {
	system: string;
	examples: FewShotExample[];
}

export interface FewShotExample {
	user: string;
	assistant: string;
}
