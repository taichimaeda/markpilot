export type OnlineProvider = (typeof ONLINE_PROVIDERS)[number];

export type OfflineProvider = (typeof OFFLINE_PROVIDERS)[number];

export type Provider = OnlineProvider | OfflineProvider;

export const ONLINE_PROVIDERS = ['openai', 'openrouter'] as const;

export const OFFLINE_PROVIDERS = ['ollama'] as const;

export const PROVIDERS = [...ONLINE_PROVIDERS, ...OFFLINE_PROVIDERS] as const;

export const DEFAULT_PROVIDER = 'openai' as Provider;
