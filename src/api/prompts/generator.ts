import Markpilot from 'src/main';
import { ChatMessage } from 'src/types';
import { FewShotPrompt } from '.';
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

  generate(prefix: string, suffix: string): ChatMessage[] {
    const { settings } = this.plugin;

    const windowSize = settings.completions.windowSize;
    const truncatedPrefix = prefix.slice(
      prefix.length - windowSize / 2,
      prefix.length,
    );
    const truncatedSuffix = suffix.slice(0, windowSize / 2);

    const context = getContext(prefix, suffix);
    const prompt = PROMPTS[context];
    if (context === 'code-block') {
      const language = getLanguage(prefix, suffix);
      prompt.system = prompt.system.replace('{{LANGUAGE}}', language);
    }

    return [
      {
        role: 'system',
        content: prompt.system,
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
        content: `${truncatedPrefix}<MASK>${truncatedSuffix}`,
      },
    ] as ChatMessage[];
  }

  parse(content: string) {
    const lines = content.split('\n');
    return lines.slice(lines.indexOf('<INSERT>') + 1).join('\n');
  }
}
