export type Provider = (typeof PROVIDERS)[number];

export type OpenAIModel = (typeof OPENAI_MODELS)[number];

export type OpenRouterModel = (typeof OPENROUTER_MODELS)[number];

export type OllamaModel = (typeof OLLAMA_MODELS)[number];

export type Model = OpenAIModel | OpenRouterModel | OllamaModel;

export const PROVIDERS = ['openai', 'openrouter', 'ollama'] as const;

export const OPENAI_MODELS = [
  'gpt-3.5-turbo-instruct',
  'davinci-002',
  'babbage-002',
  'gpt-4-0125-preview',
  'gpt-4-turbo-preview',
  'gpt-4-1106-preview',
  'gpt-4-vision-preview',
  'gpt-4',
  'gpt-4-0314',
  'gpt-4-0613',
  'gpt-4-32k',
  'gpt-4-32k-0314',
  'gpt-4-32k-0613',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-3.5-turbo-0301',
  'gpt-3.5-turbo-0613',
  'gpt-3.5-turbo-1106',
  'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo-16k-0613',
] as const;

// TODO:
// This is a placeholder.
export const OPENROUTER_MODELS = [
  'openai/gpt-3.5-turbo',
  'openai/gpt-4-turbo',
] as const;

// TODO:
// This is a placeholder.
export const OLLAMA_MODELS = [
  'llama2',
  'llama3',
  'codellama',
  'phind-codellama',
] as const;

export const MODELS = {
  openai: OPENAI_MODELS,
  openrouter: OPENROUTER_MODELS,
  ollama: OLLAMA_MODELS,
};

export const DEFAULT_MODELS: Record<Provider, Model> = {
  openai: 'gpt-3.5-turbo',
  openrouter: 'openai/gpt-3.5-turbo',
  ollama: 'llama2',
};
