export type Provider = (typeof PROVIDERS)[number];

export const PROVIDERS = ['openai', 'openrouter', 'ollama'] as const;
export const PROVIDERS_NAMES: Record<Provider, string> = {
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
  ollama: 'Ollama',
};

export const DEFAULT_PROVIDER = 'openai' as Provider;
