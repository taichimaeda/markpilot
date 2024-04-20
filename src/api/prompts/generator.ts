import Markpilot from 'src/main';
import { FewShotPrompt } from '.';
import { ChatMessage } from '..';
import { BlockQuotePrompt } from './block-quote';
import { CodeBlockPrompt } from './code-block';
import { Context, CONTEXTS_NAMES, getContext, getLanguage } from './context';
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

  processRequest(prefix: string, suffix: string): string {
    const { settings } = this.plugin;

    const windowSize = settings.completions.windowSize;
    const truncatedPrefix = prefix.slice(
      prefix.length - windowSize / 2,
      prefix.length,
    );
    const truncatedSuffix = suffix.slice(0, windowSize / 2);
    return `${truncatedPrefix}<MASK>${truncatedSuffix}`;
  }

  generateSimplePrompt(prefix: string, suffix: string) {
    const context = getContext(prefix, suffix);
    const language =
      context === 'code-block' ? getLanguage(prefix, suffix) : undefined;
    const system =
      `Insert the missing text at the location of the <MASK> from ${CONTEXTS_NAMES[context]}` +
      (language ? ` in the language ${language}.` : '.');

    return [
      {
        role: 'system',
        content: system,
      },
      {
        role: 'user',
        content: this.processRequest(prefix, suffix),
      },
    ] as ChatMessage[];
  }

  generateFewShotPrompt(prefix: string, suffix: string): ChatMessage[] {
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
      ...prompt.examples.flatMap((example) => [
        {
          role: 'user',
          content: example.user,
        },
        {
          role: 'assistant',
          content: example.assistant,
        },
      ]),
      {
        role: 'user',
        content: this.processRequest(prefix, suffix),
      },
    ] as ChatMessage[];
  }
}
