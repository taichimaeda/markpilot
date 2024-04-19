// NOTE:
// This context detection module is heavily inspired by `j0rd1smit/obsidian-copilot-auto-completion`:
// https://github.com/j0rd1smit/obsidian-copilot-auto-completion/blob/32912133b3eea43b8bfca94258ce2ca55445b2ce/src/context_detection.ts

// NOTE:
// Unicode character \uFFFF is not a valid character
// so we use it to represent the cursor position, assuming the user does not intentionally copy and paste it.
const CURSOR_CHAR = '\uFFFF';

const HEADER_REGEX = /^#+\s.*\uFFFF.*$/gm;
const UNORDERED_LIST_REGEX = /^\s*(-|\*)\s.*\uFFFF.*$/gm;
const TASK_LIST_REGEX = /^\s*(-|[0-9]+\.) +\[.\]\s.*\uFFFF.*$/gm;
const BLOCK_QUOTES_REGEX = /^\s*>.*\uFFFF.*$/gm;
const NUMBERED_LIST_REGEX = /^\s*\d+\.\s.*\uFFFF.*$/gm;
const MATH_BLOCK_REGEX = /\$\$[\s\S]*?\$\$/g;
const INLINE_MATH_BLOCK_REGEX = /\$[\s\S]*?\$/g;
const CODE_BLOCK_REGEX = /```(?<language>.*)[\s\S]*?```/g;
const INLINE_CODE_BLOCK_REGEX = /`.*`/g;

export const CONTEXTS = [
  'heading',
  'paragraph',
  'list-item',
  'block-quote',
  'math-block',
  'code-block',
] as const;

export type Context = (typeof CONTEXTS)[number];

export function getContext(prefix: string, suffix: string): Context {
  const text = prefix + CURSOR_CHAR + suffix;
  if (HEADER_REGEX.test(text)) {
    return 'heading';
  }
  if (BLOCK_QUOTES_REGEX.test(text)) {
    return 'block-quote';
  }
  if (
    NUMBERED_LIST_REGEX.test(text) ||
    UNORDERED_LIST_REGEX.test(text) ||
    TASK_LIST_REGEX.test(text)
  ) {
    return 'list-item';
  }
  if (
    isCursorInBlock(text, MATH_BLOCK_REGEX) ||
    isCursorInBlock(text, INLINE_MATH_BLOCK_REGEX)
  ) {
    return 'math-block';
  }
  if (
    isCursorInBlock(text, CODE_BLOCK_REGEX) ||
    isCursorInBlock(text, INLINE_CODE_BLOCK_REGEX)
  ) {
    return 'code-block';
  }

  return 'paragraph';
}

export function getLanguage(prefix: string, suffix: string): string {
  const text = prefix + CURSOR_CHAR + suffix;
  if (!isCursorInBlock(text, CODE_BLOCK_REGEX)) {
    throw new Error('Cursor is not in a code block');
  }

  const match = text.match(CODE_BLOCK_REGEX);
  const language = match?.groups?.language ?? 'plaintext';
  return `${language}code-block`;
}

function isCursorInBlock(text: string, regex: RegExp): boolean {
  const blocks = text.match(regex) ?? [];
  return blocks.some((block) => block.includes(CURSOR_CHAR));
}
