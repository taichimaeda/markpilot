function generateRandomString(n: number): string {
  let result = '';
  const characters = '0123456789abcdef';
  for (let i = 0; i < n; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

const UNIQUE_CURSOR = `${generateRandomString(16)}`;
const HEADER_REGEX = `^#+\\s.*${UNIQUE_CURSOR}.*$`;
const UNORDERED_LIST_REGEX = `^\\s*(-|\\*)\\s.*${UNIQUE_CURSOR}.*$`;
const TASK_LIST_REGEX = `^\\s*(-|[0-9]+\\.) +\\[.\\]\\s.*${UNIQUE_CURSOR}.*$`;
const BLOCK_QUOTES_REGEX = `^\\s*>.*${UNIQUE_CURSOR}.*$`;
const NUMBERED_LIST_REGEX = `^\\s*\\d+\\.\\s.*${UNIQUE_CURSOR}.*$`;
const MATH_BLOCK_REGEX = /\$\$[\s\S]*?\$\$/g;
const INLINE_MATH_BLOCK_REGEX = /\$[\s\S]*?\$/g;
const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;
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

// TODO:
// Determine the language of code blocks and return it along with the context.
export function getContext(prefix: string, suffix: string): Context {
  const text = prefix + UNIQUE_CURSOR + suffix;
  if (new RegExp(HEADER_REGEX, 'gm').test(text)) {
    return 'heading';
  }
  if (new RegExp(BLOCK_QUOTES_REGEX, 'gm').test(text)) {
    return 'block-quote';
  }
  if (
    new RegExp(NUMBERED_LIST_REGEX, 'gm').test(text) ||
    new RegExp(UNORDERED_LIST_REGEX, 'gm').test(text) ||
    new RegExp(TASK_LIST_REGEX, 'gm').test(text)
  ) {
    return 'list-item';
  }
  if (
    isCursorInRegexBlock(text, MATH_BLOCK_REGEX) ||
    isCursorInRegexBlock(text, INLINE_MATH_BLOCK_REGEX)
  ) {
    return 'math-block';
  }

  if (
    isCursorInRegexBlock(text, CODE_BLOCK_REGEX) ||
    isCursorInRegexBlock(text, INLINE_CODE_BLOCK_REGEX)
  ) {
    return 'code-block';
  }

  return 'paragraph';
}

function isCursorInRegexBlock(text: string, regex: RegExp): boolean {
  const codeBlocks = extractBlocks(text, regex);
  for (const block of codeBlocks) {
    if (block.includes(UNIQUE_CURSOR)) {
      return true;
    }
  }
  return false;
}

function extractBlocks(text: string, regex: RegExp) {
  const codeBlocks = text.match(regex);
  return codeBlocks ? codeBlocks.map((block) => block.trim()) : [];
}
