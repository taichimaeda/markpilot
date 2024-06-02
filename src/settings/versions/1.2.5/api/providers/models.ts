import { getObjectKeys } from 'src/utils';
import { Provider } from '.';
import OllamaModelsJSON from './ollama.json';
import OpenAIModelsJSON from './openai.json';
import OpenRouterModelsJSON from './openrouter.json';

export type OpenAIModel = keyof typeof OpenAIModelsJSON;
export type OpenRouterModel = keyof typeof OpenRouterModelsJSON;
export type OllamaModel = keyof typeof OllamaModelsJSON;

export type Model = OpenAIModel | OpenRouterModel | OllamaModel;

export const OPENAI_MODELS = getObjectKeys(OpenAIModelsJSON);
export const OPENROUTER_MODELS = getObjectKeys(OpenRouterModelsJSON);
export const OLLAMA_MODELS = getObjectKeys(OllamaModelsJSON);

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
