import systemPrompt from './system.txt';

export interface FewShowExample {
  user: string;
  assistant: string;
}

export class PromptGenerator {
  private systemPrompt = systemPrompt;

  generate(prefix: string, suffix: string): string {
    // TODO:
    // 1. Determine the context from prefix and suffix.
    // 2. Generate a prompt based on the context, with prefix and suffix trimmed according to window size.
    const language = 'english';
    if (language) {
      return this.systemPrompt.replace('{{LANGUAGE}}', language);
    }
    return '';
  }
}
