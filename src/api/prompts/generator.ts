import Markpilot from 'src/main';
import { FewShotPrompt } from '.';
import { ChatMessage } from '..';
import { BlockQuotePrompt } from './block-quote';
import { CodeBlockPrompt } from './code-block';
import { Context, getContext, getLanguage } from './context';
import { HeadingPrompt } from './heading';
import { ListItemPrompt } from './list-item';
import { MathBlockPrompt } from './math-block';
import { ParagraphPrompt } from './paragraph';

const PROMPTS: Record<Context, FewShotPrompt> = {
  heading: HeadingPrompt,
  paragraph: ParagraphPrompt,
  'list-item': ListItemPrompt,
  'block-quote': BlockQuotePrompt,
  'math-block': MathBlockPrompt,
  'code-block': CodeBlockPrompt,
};

export class PromptGenerator {
  constructor(private plugin: Markpilot) {}

  parseResponse(content: string) {
    const lines = content.split('\n');
    return lines.slice(lines.indexOf('<INSERT>') + 1).join('\n');
  }

  makeExamples(prefix: string, suffix: string) {
    const { settings } = this.plugin;

    if (!settings.completions.fewShot) {
      return [];
    }

    const context = getContext(prefix, suffix);
    const prompt = PROMPTS[context];
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

  makeRequest(prefix: string, suffix: string): string {
    const { settings } = this.plugin;

    const windowSize = settings.completions.windowSize;
    const truncatedPrefix = prefix.slice(
      prefix.length - windowSize / 2,
      prefix.length,
    );
    const truncatedSuffix = suffix.slice(0, windowSize / 2);
    return `${truncatedPrefix}<MASK>${truncatedSuffix}`;
  }

  generatePrompt(prefix: string, suffix: string) {
    const context = getContext(prefix, suffix);
    const prompt = PROMPTS[context];
    const system =
      context === 'code-block'
        ? prompt.system.replace('{{LANGUAGE}}', getLanguage(prefix, suffix)!)
        : prompt.system;

    return [
      {
        role: 'system',
        content: system,
      },
      ...this.makeExamples(prefix, suffix),
      {
        role: 'user',
        content: this.makeRequest(prefix, suffix),
      },
    ] as ChatMessage[];
  }
}
